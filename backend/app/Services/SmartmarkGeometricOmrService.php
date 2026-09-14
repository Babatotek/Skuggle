<?php

namespace App\Services;

use App\Exceptions\ApiException;

/**
 * Grid-aligned OMR reader: locate corner fiducials, sample bubble fill ratios,
 * and decode the printed scan-code bit strip. Uses PHP GD only.
 */
final class SmartmarkGeometricOmrService
{
    public function __construct(private readonly SmartmarkOmrGeometry $geometry) {}

    /**
     * @param  array<string, mixed>  $layout  omrLayout() payload including geometry + items
     * @return list<array<string, mixed>>
     */
    public function extract(string $bytes, string $mime, array $layout): array
    {
        if (str_contains(strtolower($mime), 'pdf')) {
            throw new ApiException('OMR_PDF_UNSUPPORTED', 'Geometric OMR requires a raster scan (PNG/JPEG/WebP). Convert PDF pages before upload or use OCR_PROVIDER=geometric+gemini.', 422);
        }

        $image = $this->loadImage($bytes);
        if ($image === false) {
            throw new ApiException('OMR_IMAGE_UNREADABLE', 'The scan could not be decoded as an image.', 422);
        }

        try {
            $geometry = is_array($layout['geometry'] ?? null) ? $layout['geometry'] : $this->geometry->build((array) ($layout['items'] ?? []));
            $width = imagesx($image);
            $height = imagesy($image);
            $gray = $this->toGray($image);
            imagedestroy($image);

            $transform = $this->resolveTransform($gray, $width, $height, $geometry);
            $scanCode = $this->readScanStrip($gray, $width, $height, $geometry, $transform);
            [$admission, $studentName] = $this->identityFromScanCode($scanCode);

            $answers = [];
            $confidences = [];
            $items = array_values((array) ($layout['items'] ?? []));
            foreach ($items as $item) {
                $question = (int) $item['number'];
                $choices = array_values((array) ($item['choices'] ?? []));
                $fills = [];
                foreach ($choices as $choice) {
                    $bubble = $this->bubbleFor($geometry, $question, (string) $choice);
                    if ($bubble === null) {
                        $fills[$choice] = 0.0;

                        continue;
                    }
                    $fills[$choice] = $this->sampleFill($gray, $width, $height, $bubble, $transform);
                }
                [$letter, $confidence] = $this->decideChoice($fills);
                $answers[] = $letter;
                $confidences[] = $confidence;
            }

            $sheetConfidence = $confidences === [] ? 40.0 : array_sum($confidences) / count($confidences);
            if ($scanCode === null) {
                $sheetConfidence = min($sheetConfidence, 70.0);
            }

            return [[
                'admissionNumber' => $admission,
                'studentName' => $studentName,
                'scanCode' => $scanCode,
                'answers' => $answers,
                'confidence' => round($sheetConfidence, 2),
                'humanReviewRequired' => $sheetConfidence < (float) config('skuggle.ocr.review_threshold', 92) || in_array('?', $answers, true) || $admission === null,
                'flagReason' => $this->flagReason($answers, $admission, $transform['method']),
                'page' => 1,
                'omrMethod' => 'geometric',
                'omrRegistration' => $transform['method'],
            ]];
        } finally {
            if (isset($gray) && (is_resource($gray) || $gray instanceof \GdImage)) {
                imagedestroy($gray);
            }
        }
    }

    /**
     * Build a synthetic raster matching the print template (for tests / fixtures).
     *
     * @param  array<string, mixed>  $layout
     * @param  list<string>  $answers
     */
    public function synthesize(array $layout, string $scanCode, array $answers, int $scale = 2): string
    {
        $geometry = is_array($layout['geometry'] ?? null) ? $layout['geometry'] : $this->geometry->build((array) ($layout['items'] ?? []));
        $w = (int) $geometry['pageWidth'] * $scale;
        $h = (int) $geometry['pageHeight'] * $scale;
        $image = imagecreatetruecolor($w, $h);
        $white = imagecolorallocate($image, 255, 255, 255);
        $black = imagecolorallocate($image, 0, 0, 0);
        imagefilledrectangle($image, 0, 0, $w, $h, $white);

        foreach ($geometry['fiducials'] as $mark) {
            imagefilledrectangle(
                $image,
                (int) ($mark['x'] * $scale),
                (int) ($mark['y'] * $scale),
                (int) (($mark['x'] + $mark['size']) * $scale) - 1,
                (int) (($mark['y'] + $mark['size']) * $scale) - 1,
                $black
            );
        }

        $strip = $geometry['scanStrip'];
        $bits = $this->geometry->encodeScanStrip($scanCode, (int) $strip['maxModules']);
        foreach ($bits as $i => $bit) {
            if (! $bit) {
                continue;
            }
            $x0 = (int) (($strip['x'] + ($i * $strip['moduleWidth'])) * $scale);
            $y0 = (int) ($strip['y'] * $scale);
            imagefilledrectangle(
                $image,
                $x0,
                $y0,
                $x0 + ((int) $strip['moduleWidth'] * $scale) - 1,
                $y0 + ((int) $strip['moduleHeight'] * $scale) - 1,
                $black
            );
        }

        $answerByQuestion = [];
        foreach (array_values((array) ($layout['items'] ?? [])) as $index => $item) {
            $answerByQuestion[(int) $item['number']] = strtoupper((string) ($answers[$index] ?? ''));
        }
        foreach ($geometry['bubbles'] as $bubble) {
            $cx = (int) ($bubble['cx'] * $scale);
            $cy = (int) ($bubble['cy'] * $scale);
            $r = (int) ($bubble['r'] * $scale);
            imageellipse($image, $cx, $cy, $r * 2, $r * 2, $black);
            $selected = $answerByQuestion[(int) $bubble['question']] ?? '';
            if ($selected !== '' && $selected === strtoupper((string) $bubble['choice'])) {
                imagefilledellipse($image, $cx, $cy, (int) ($r * 1.6), (int) ($r * 1.6), $black);
            }
        }

        ob_start();
        imagepng($image);
        $png = (string) ob_get_clean();
        imagedestroy($image);

        return $png;
    }

    /** @return resource|\GdImage|false */
    private function loadImage(string $bytes)
    {
        $image = @imagecreatefromstring($bytes);
        if ($image !== false) {
            return $image;
        }

        return false;
    }

    /** @param resource|\GdImage $image @return resource|\GdImage */
    private function toGray($image)
    {
        $w = imagesx($image);
        $h = imagesy($image);
        $gray = imagecreatetruecolor($w, $h);
        imagecopy($gray, $image, 0, 0, 0, 0, $w, $h);
        imagefilter($gray, IMG_FILTER_GRAYSCALE);

        return $gray;
    }

    /**
     * @param  resource|\GdImage  $gray
     * @param  array<string, mixed>  $geometry
     * @return array{sx:float,sy:float,ox:float,oy:float,method:string}
     */
    private function resolveTransform($gray, int $width, int $height, array $geometry): array
    {
        $pageW = (float) $geometry['pageWidth'];
        $pageH = (float) $geometry['pageHeight'];
        $found = [];
        foreach ($geometry['fiducials'] as $mark) {
            $hit = $this->findFiducial($gray, $width, $height, $mark, $pageW, $pageH);
            if ($hit !== null) {
                $found[$mark['id']] = $hit;
            }
        }

        if (isset($found['tl'], $found['tr'], $found['bl'])) {
            $sx = ($found['tr']['x'] - $found['tl']['x']) / max(1.0, (float) ($geometry['fiducials'][1]['x'] - $geometry['fiducials'][0]['x']));
            $sy = ($found['bl']['y'] - $found['tl']['y']) / max(1.0, (float) ($geometry['fiducials'][2]['y'] - $geometry['fiducials'][0]['y']));
            if ($sx > 0.2 && $sy > 0.2) {
                return [
                    'sx' => $sx,
                    'sy' => $sy,
                    'ox' => $found['tl']['x'] - ((float) $geometry['fiducials'][0]['x'] * $sx),
                    'oy' => $found['tl']['y'] - ((float) $geometry['fiducials'][0]['y'] * $sy),
                    'method' => 'fiducial',
                ];
            }
        }

        return [
            'sx' => $width / $pageW,
            'sy' => $height / $pageH,
            'ox' => 0.0,
            'oy' => 0.0,
            'method' => 'page-scale',
        ];
    }

    /**
     * @param  resource|\GdImage  $gray
     * @param  array{x:int,y:int,size:int}  $mark
     * @return array{x:float,y:float}|null
     */
    private function findFiducial($gray, int $width, int $height, array $mark, float $pageW, float $pageH): ?array
    {
        $approxX = (int) (($mark['x'] / $pageW) * $width);
        $approxY = (int) (($mark['y'] / $pageH) * $height);
        $search = (int) max(20, min($width, $height) * 0.08);
        $best = null;
        $bestScore = 0.0;
        $step = max(2, (int) ($search / 20));
        for ($y = max(0, $approxY - $search); $y < min($height - 4, $approxY + $search); $y += $step) {
            for ($x = max(0, $approxX - $search); $x < min($width - 4, $approxX + $search); $x += $step) {
                $score = $this->darkBlockScore($gray, $width, $height, $x, $y, (int) max(8, ($mark['size'] / $pageW) * $width));
                if ($score > $bestScore) {
                    $bestScore = $score;
                    $best = ['x' => (float) $x, 'y' => (float) $y];
                }
            }
        }

        return $bestScore >= 0.55 ? $best : null;
    }

    /** @param resource|\GdImage $gray */
    private function darkBlockScore($gray, int $width, int $height, int $x, int $y, int $size): float
    {
        $dark = 0;
        $total = 0;
        $size = max(6, min($size, 40));
        for ($yy = $y; $yy < $y + $size && $yy < $height; $yy += 2) {
            for ($xx = $x; $xx < $x + $size && $xx < $width; $xx += 2) {
                $total++;
                if ($this->luma($gray, $xx, $yy) < 90) {
                    $dark++;
                }
            }
        }

        return $total > 0 ? $dark / $total : 0.0;
    }

    /**
     * @param  resource|\GdImage  $gray
     * @param  array<string, mixed>  $geometry
     * @param  array{sx:float,sy:float,ox:float,oy:float,method:string}  $transform
     */
    private function readScanStrip($gray, int $width, int $height, array $geometry, array $transform): ?string
    {
        $strip = $geometry['scanStrip'];
        $bits = [];
        $max = (int) $strip['maxModules'];
        for ($i = 0; $i < $max; $i++) {
            $cx = (float) $strip['x'] + ($i * (float) $strip['moduleWidth']) + ((float) $strip['moduleWidth'] / 2);
            $cy = (float) $strip['y'] + ((float) $strip['moduleHeight'] / 2);
            [$px, $py] = $this->mapPoint($cx, $cy, $transform);
            if ($px < 0 || $py < 0 || $px >= $width || $py >= $height) {
                $bits[] = 0;

                continue;
            }
            $bits[] = $this->luma($gray, (int) $px, (int) $py) < 110 ? 1 : 0;
        }

        return $this->geometry->decodeScanStrip($bits);
    }

    /**
     * @return array{0:?string,1:?string}
     */
    private function identityFromScanCode(?string $scanCode): array
    {
        if ($scanCode === null || $scanCode === '') {
            return [null, null];
        }
        if (preg_match('/^SM\|[0-9A-HJKMNP-TV-Z]{26}\|(.+)$/i', $scanCode, $match)) {
            return [trim($match[1]), null];
        }

        return [$scanCode, null];
    }

    /**
     * @param  array<string, mixed>  $geometry
     * @return array{question:int,choice:string,cx:int,cy:int,r:int}|null
     */
    private function bubbleFor(array $geometry, int $question, string $choice): ?array
    {
        foreach ($geometry['bubbles'] as $bubble) {
            if ((int) $bubble['question'] === $question && strtoupper((string) $bubble['choice']) === strtoupper($choice)) {
                return $bubble;
            }
        }

        return null;
    }

    /**
     * @param  resource|\GdImage  $gray
     * @param  array{question:int,choice:string,cx:int,cy:int,r:int}  $bubble
     * @param  array{sx:float,sy:float,ox:float,oy:float,method:string}  $transform
     */
    private function sampleFill($gray, int $width, int $height, array $bubble, array $transform): float
    {
        [$cx, $cy] = $this->mapPoint((float) $bubble['cx'], (float) $bubble['cy'], $transform);
        $r = max(2.0, ((float) $bubble['r'] * (($transform['sx'] + $transform['sy']) / 2)) * 0.75);
        $dark = 0;
        $total = 0;
        for ($y = (int) floor($cy - $r); $y <= (int) ceil($cy + $r); $y++) {
            for ($x = (int) floor($cx - $r); $x <= (int) ceil($cx + $r); $x++) {
                if ($x < 0 || $y < 0 || $x >= $width || $y >= $height) {
                    continue;
                }
                $dx = $x - $cx;
                $dy = $y - $cy;
                if (($dx * $dx) + ($dy * $dy) > ($r * $r)) {
                    continue;
                }
                $total++;
                if ($this->luma($gray, $x, $y) < 100) {
                    $dark++;
                }
            }
        }

        return $total > 0 ? $dark / $total : 0.0;
    }

    /**
     * @param  array<string, float>  $fills
     * @return array{0:string,1:float}
     */
    private function decideChoice(array $fills): array
    {
        if ($fills === []) {
            return ['?', 40.0];
        }
        arsort($fills);
        $letters = array_keys($fills);
        $top = (float) $fills[$letters[0]];
        $second = isset($letters[1]) ? (float) $fills[$letters[1]] : 0.0;
        if ($top < SmartmarkOmrGeometry::FILL_THRESHOLD) {
            return ['?', max(35.0, 55.0 - (($SmartmarkOmrGeometry::FILL_THRESHOLD - $top) * 100))];
        }
        if (($top - $second) < SmartmarkOmrGeometry::AMBIGUOUS_RATIO) {
            return ['?', 48.0];
        }
        $confidence = min(99.0, 70.0 + ($top * 30.0));

        return [strtoupper((string) $letters[0]), $confidence];
    }

    /**
     * @param  list<string>  $answers
     * @param  array{sx:float,sy:float,ox:float,oy:float,method:string}  $transform
     */
    private function flagReason(array $answers, ?string $admission, string $method): ?string
    {
        $flags = [];
        if ($admission === null) {
            $flags[] = 'Scan code / admission not decoded from geometric strip.';
        }
        if (in_array('?', $answers, true)) {
            $flags[] = 'Ambiguous or empty bubble mark detected.';
        }
        if ($method === 'page-scale') {
            $flags[] = 'Corner fiducials weak; used page-scale registration.';
        }

        return $flags === [] ? null : implode(' ', $flags);
    }

    /**
     * @param  array{sx:float,sy:float,ox:float,oy:float,method:string}  $transform
     * @return array{0:float,1:float}
     */
    private function mapPoint(float $x, float $y, array $transform): array
    {
        return [
            ($x * $transform['sx']) + $transform['ox'],
            ($y * $transform['sy']) + $transform['oy'],
        ];
    }

    /** @param resource|\GdImage $gray */
    private function luma($gray, int $x, int $y): int
    {
        $rgb = imagecolorat($gray, $x, $y);
        $r = ($rgb >> 16) & 0xFF;

        return $r;
    }
}
