<?php

namespace App\Domain\Library\AI;

use App\Exceptions\ApiException;
use App\Models\AiRequest;
use Illuminate\Http\UploadedFile;

final class AIManager
{
    public function __construct(private readonly AIProvider $provider) {}

    public function generate(string $operation, string $system, string $prompt, ?int $userId = null): array
    {
        $started = hrtime(true);
        $record = AiRequest::query()->create([
            'user_id' => $userId, 'operation' => $operation, 'provider' => $this->provider->name(),
            'model' => $this->provider->model(), 'prompt_hash' => hash('sha256', $system.'|'.$prompt), 'status' => 'processing',
        ]);
        try {
            $result = $this->provider->generateJson($system, $prompt);
            $record->update(['status' => 'complete', 'latency_ms' => (int) ((hrtime(true) - $started) / 1_000_000), 'completed_at' => now()]);

            return $result;
        } catch (\Throwable $exception) {
            $record->update(['status' => 'failed', 'error_code' => $exception instanceof ApiException ? $exception->errorCode : 'AI_ERROR', 'latency_ms' => (int) ((hrtime(true) - $started) / 1_000_000), 'completed_at' => now()]);
            throw $exception;
        }
    }

    public function transcribe(UploadedFile $audio, ?int $userId = null): string
    {
        $started = hrtime(true);
        $record = AiRequest::query()->create(['user_id' => $userId, 'operation' => 'annotation_transcription', 'provider' => $this->provider->name(), 'model' => $this->provider->model(), 'prompt_hash' => hash_file('sha256', $audio->getRealPath()), 'status' => 'processing']);
        try {
            $transcript = $this->provider->transcribe($audio);
            $record->update(['status' => 'complete', 'latency_ms' => (int) ((hrtime(true) - $started) / 1_000_000), 'completed_at' => now()]);

            return $transcript;
        } catch (\Throwable $exception) {
            $record->update(['status' => 'failed', 'error_code' => $exception instanceof ApiException ? $exception->errorCode : 'TRANSCRIPTION_ERROR', 'latency_ms' => (int) ((hrtime(true) - $started) / 1_000_000), 'completed_at' => now()]);
            throw $exception;
        }
    }
}
