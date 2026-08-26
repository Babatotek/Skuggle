<?php

namespace App\Domain\Library\AI;

use Illuminate\Http\UploadedFile;

interface AIProvider
{
    public function name(): string;

    public function model(): string;

    public function generateJson(string $system, string $prompt): array;

    public function transcribe(UploadedFile $audio): string;
}
