<?php

namespace App\Services;

final class SimplePdf
{
    public function make(array $pages): string
    {
        $objects = [];
        $pageIds = [];
        $fontId = 3;
        $nextId = 4;
        foreach ($pages as $lines) {
            $pageId = $nextId++;
            $contentId = $nextId++;
            $pageIds[] = $pageId;
            $content = "BT\n/F1 11 Tf\n50 790 Td\n14 TL\n";
            foreach (array_slice($lines, 0, 50) as $index => $line) {
                if ($index > 0) {
                    $content .= "T*\n";
                }
                $content .= '('.$this->escape(mb_strimwidth((string) $line, 0, 105, '...')).") Tj\n";
            }
            $content .= "ET\n";
            $objects[$pageId] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 {$fontId} 0 R >> >> /Contents {$contentId} 0 R >>";
            $objects[$contentId] = '<< /Length '.strlen($content)." >>\nstream\n{$content}endstream";
        }
        $objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
        $objects[2] = '<< /Type /Pages /Kids ['.implode(' ', array_map(fn ($id) => "{$id} 0 R", $pageIds)).'] /Count '.count($pageIds).' >>';
        $objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
        ksort($objects);
        $pdf = "%PDF-1.4\n";
        $offsets = [0 => 0];
        foreach ($objects as $id => $object) {
            $offsets[$id] = strlen($pdf);
            $pdf .= "{$id} 0 obj\n{$object}\nendobj\n";
        }
        $xref = strlen($pdf);
        $maxId = max(array_keys($objects));
        $pdf .= "xref\n0 ".($maxId + 1)."\n0000000000 65535 f \n";
        for ($id = 1; $id <= $maxId; $id++) {
            $pdf .= sprintf('%010d 00000 n ', $offsets[$id] ?? 0)."\n";
        }

        return $pdf."trailer\n<< /Size ".($maxId + 1)." /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF\n";
    }

    private function escape(string $text): string
    {
        $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text) ?: $text;

        return str_replace(['\\', '(', ')', "\r", "\n"], ['\\\\', '\\(', '\\)', '', ' '], $ascii);
    }
}
