<?php

namespace App\Services;

use App\Exceptions\ApiException;
use Illuminate\Http\UploadedFile;
use Smalot\PdfParser\Parser;
use ZipArchive;

final class DocumentTextExtractor
{
    private const MAX_CHARACTERS = 250000;

    public function extract(UploadedFile $file): string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $text = match ($extension) {
            'txt' => file_get_contents($file->getRealPath()),
            'docx' => $this->docx($file->getRealPath()),
            'pdf' => $this->pdf($file->getRealPath()),
            default => throw new ApiException('UNSUPPORTED_DOCUMENT', 'Only PDF, DOCX and plain-text syllabus documents are supported.', 422),
        };
        if (! is_string($text)) {
            throw new ApiException('DOCUMENT_EXTRACTION_FAILED', 'The document text could not be read.', 422);
        }
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text) ?? '';
        $text = preg_replace('/[ \t]+/u', ' ', $text) ?? $text;
        $text = preg_replace('/\R{3,}/u', "\n\n", $text) ?? $text;
        $text = trim(mb_substr($text, 0, self::MAX_CHARACTERS));
        if (mb_strlen($text) < 80) {
            throw new ApiException('DOCUMENT_TEXT_TOO_SHORT', 'Not enough readable syllabus text was found. A scanned PDF may need OCR before upload.', 422);
        }

        return $text;
    }

    public function outcomes(string $text): array
    {
        $lines = preg_split('/\R/u', $text) ?: [];
        $verbs = 'understand|identify|describe|explain|define|compare|contrast|calculate|solve|demonstrate|analyse|analyze|evaluate|create|apply|list|state|discuss|interpret|recognise|recognize';
        $candidates = [];
        foreach ($lines as $line) {
            $line = trim(preg_replace('/^[\s\-•*\d.)]+/u', '', $line) ?? '');
            if (mb_strlen($line) < 15 || mb_strlen($line) > 350) {
                continue;
            }
            if (preg_match("/^(learners?|students?|pupils?)?\s*(should|will|shall|can|must|are expected to|be able to)?\s*({$verbs})\b/i", $line) || preg_match('/learning outcomes?|objectives?/i', $line)) {
                $candidates[] = $line;
            }
        }
        if (! $candidates) {
            $sentences = preg_split('/(?<=[.!?])\s+/u', $text) ?: [];
            $candidates = array_values(array_filter($sentences, fn ($sentence) => mb_strlen(trim($sentence)) >= 25 && mb_strlen(trim($sentence)) <= 350));
        }
        $candidates = array_slice(array_values(array_unique($candidates)), 0, 20);

        return collect($candidates)->map(fn ($line, $index) => ['id' => 'outcome-'.($index + 1), 'title' => rtrim(trim($line), '.;'), 'confidence' => preg_match("/\b({$verbs})\b/i", $line) ? 0.9 : 0.65])->all();
    }

    private function docx(string $path): string
    {
        $zip = new ZipArchive;
        if ($zip->open($path) !== true) {
            throw new ApiException('DOCUMENT_EXTRACTION_FAILED', 'The DOCX document could not be opened.', 422);
        }
        $xml = $zip->getFromName('word/document.xml');
        $zip->close();
        if (! is_string($xml)) {
            throw new ApiException('DOCUMENT_EXTRACTION_FAILED', 'The DOCX document contains no readable body.', 422);
        }
        $xml = str_replace(['</w:p>', '</w:tr>', '<w:tab/>'], ["\n", "\n", "\t"], $xml);

        return html_entity_decode(strip_tags($xml), ENT_QUOTES | ENT_XML1, 'UTF-8');
    }

    private function pdf(string $path): string
    {
        try {
            return (new Parser)->parseFile($path)->getText();
        } catch (\Throwable) {
            throw new ApiException('DOCUMENT_EXTRACTION_FAILED', 'The PDF text could not be extracted. Password-protected or scanned PDFs are not supported.', 422);
        }
    }
}
