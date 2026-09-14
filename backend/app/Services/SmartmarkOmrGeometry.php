<?php

namespace App\Services;

/**
 * Canonical SmartMark OMR page geometry in normalized units (page = 1000 × 1414 ≈ A4).
 * Print CSS and geometric reader share this map so bubbles align to the printed grid.
 */
final class SmartmarkOmrGeometry
{
    public const VERSION = 'sm-omr-v1';

    public const PAGE_WIDTH = 1000;

    public const PAGE_HEIGHT = 1414;

    public const FIDUCIAL_SIZE = 28;

    public const FIDUCIAL_INSET = 36;

    public const BUBBLE_RADIUS = 11;

    public const FILL_THRESHOLD = 0.32;

    public const AMBIGUOUS_RATIO = 0.22;

    /**
     * @param  list<array{number:int,choices:list<string>,questionType:string,prompt:string,marks:float}>  $items
     * @return array{
     *   version:string,
     *   pageWidth:int,
     *   pageHeight:int,
     *   fiducials:list<array{id:string,x:int,y:int,size:int}>,
     *   scanStrip:array{x:int,y:int,moduleWidth:int,moduleHeight:int,maxModules:int},
     *   bubbles:list<array{question:int,choice:string,cx:int,cy:int,r:int}>
     * }
     */
    public function build(array $items): array
    {
        $fiducials = [
            ['id' => 'tl', 'x' => self::FIDUCIAL_INSET, 'y' => self::FIDUCIAL_INSET, 'size' => self::FIDUCIAL_SIZE],
            ['id' => 'tr', 'x' => self::PAGE_WIDTH - self::FIDUCIAL_INSET - self::FIDUCIAL_SIZE, 'y' => self::FIDUCIAL_INSET, 'size' => self::FIDUCIAL_SIZE],
            ['id' => 'bl', 'x' => self::FIDUCIAL_INSET, 'y' => self::PAGE_HEIGHT - self::FIDUCIAL_INSET - self::FIDUCIAL_SIZE, 'size' => self::FIDUCIAL_SIZE],
            ['id' => 'br', 'x' => self::PAGE_WIDTH - self::FIDUCIAL_INSET - self::FIDUCIAL_SIZE, 'y' => self::PAGE_HEIGHT - self::FIDUCIAL_INSET - self::FIDUCIAL_SIZE, 'size' => self::FIDUCIAL_SIZE],
        ];

        $bubbles = [];
        $rowHeight = 34;
        $leftX = 70;
        $rightX = 540;
        $startY = 290;
        $maxRows = 30;
        foreach (array_values($items) as $index => $item) {
            if ($index >= $maxRows * 2) {
                break;
            }
            $column = intdiv($index, $maxRows);
            $row = $index % $maxRows;
            $baseX = $column === 0 ? $leftX : $rightX;
            $cy = $startY + ($row * $rowHeight);
            foreach (array_values($item['choices']) as $choiceIndex => $choice) {
                $bubbles[] = [
                    'question' => (int) $item['number'],
                    'choice' => (string) $choice,
                    'cx' => $baseX + 40 + ($choiceIndex * 36),
                    'cy' => $cy,
                    'r' => self::BUBBLE_RADIUS,
                ];
            }
        }

        return [
            'version' => self::VERSION,
            'pageWidth' => self::PAGE_WIDTH,
            'pageHeight' => self::PAGE_HEIGHT,
            'fiducials' => $fiducials,
            'scanStrip' => [
                'x' => 70,
                'y' => 236,
                'moduleWidth' => 2,
                'moduleHeight' => 18,
                'maxModules' => 420,
            ],
            'bubbles' => $bubbles,
        ];
    }

    /** Encode scan payload as black/white modules (length-prefixed ASCII). */
    public function encodeScanStrip(string $payload, int $maxModules = 420): array
    {
        $maxBytes = max(1, intdiv($maxModules - 8, 8));
        $payload = mb_substr($payload, 0, min(64, $maxBytes));
        $bytes = unpack('C*', $payload) ?: [];
        $bits = [];
        $length = count($bytes);
        for ($i = 7; $i >= 0; $i--) {
            $bits[] = ($length >> $i) & 1;
        }
        foreach ($bytes as $byte) {
            for ($i = 7; $i >= 0; $i--) {
                $bits[] = ($byte >> $i) & 1;
            }
        }

        return $bits;
    }

    /**
     * @param  list<int>  $bits
     */
    public function decodeScanStrip(array $bits): ?string
    {
        if (count($bits) < 8) {
            return null;
        }
        $length = 0;
        for ($i = 0; $i < 8; $i++) {
            $length = ($length << 1) | ((int) ($bits[$i] ?? 0) & 1);
        }
        if ($length < 1 || $length > 64 || count($bits) < 8 + ($length * 8)) {
            return null;
        }
        $chars = [];
        for ($b = 0; $b < $length; $b++) {
            $byte = 0;
            for ($i = 0; $i < 8; $i++) {
                $byte = ($byte << 1) | ((int) ($bits[8 + ($b * 8) + $i] ?? 0) & 1);
            }
            if ($byte < 32 || $byte > 126) {
                return null;
            }
            $chars[] = chr($byte);
        }

        return implode('', $chars);
    }
}
