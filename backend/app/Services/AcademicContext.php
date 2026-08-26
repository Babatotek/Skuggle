<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\AcademicSession;
use App\Models\Term;
use Illuminate\Http\Request;

final class AcademicContext
{
    public function resolve(Request $request): array
    {
        $sessionPublicId = $request->session()->get('academic_session_public_id');
        $termPublicId = $request->session()->get('term_public_id');
        $session = AcademicSession::query()->when($sessionPublicId, fn ($query) => $query->where('public_id', $sessionPublicId), fn ($query) => $query->where('is_current', true))->first();
        $term = Term::query()->when($termPublicId, fn ($query) => $query->where('public_id', $termPublicId), fn ($query) => $query->where('is_current', true))->first();
        if (! $session || ! $term || $term->academic_session_id !== $session->getKey()) {
            throw new ApiException('ACADEMIC_CONTEXT_REQUIRED', 'Select an active academic session and term before continuing.', 409);
        }

        return [$session, $term];
    }
}
