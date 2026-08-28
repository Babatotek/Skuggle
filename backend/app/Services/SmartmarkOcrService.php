<?php
namespace App\Services;
use App\Exceptions\ApiException;
use Illuminate\Support\Facades\Http;

final class SmartmarkOcrService
{
    public function extract(string $bytes, string $mime, array $answerKey, int $maxScore): array
    {
        if (config('skuggle.ocr.provider') !== 'gemini') throw new ApiException('OCR_NOT_CONFIGURED','Configure OCR_PROVIDER=gemini and GEMINI_API_KEY before processing scans.',503);
        $key=(string)config('skuggle.ai.gemini.key'); if($key==='') throw new ApiException('OCR_NOT_CONFIGURED','Gemini OCR credentials are missing.',503);
        $prompt='Read every OMR answer sheet in this image or PDF. Return strict JSON only: {"sheets":[{"admissionNumber":"","studentName":"","answers":["A"],"confidence":0-100,"humanReviewRequired":true,"flagReason":""}]}. Use ? for ambiguous marks. Never infer an unreadable admission number.';
        $response=Http::timeout((int)config('skuggle.ocr.timeout',90))->retry(2,500)->withHeaders(['x-goog-api-key'=>$key])->post('https://generativelanguage.googleapis.com/v1beta/models/'.rawurlencode((string)config('skuggle.ai.gemini.model')).':generateContent',[
            'contents'=>[['parts'=>[['inline_data'=>['mime_type'=>$mime,'data'=>base64_encode($bytes)]],['text'=>$prompt]]]],
            'generationConfig'=>['responseMimeType'=>'application/json','temperature'=>0],
        ]);
        if(!$response->successful()) throw new ApiException('OCR_PROVIDER_FAILED','The OCR provider could not process this scan.',502);
        $text=(string)data_get($response->json(),'candidates.0.content.parts.0.text',''); $decoded=json_decode($text,true);
        if(!is_array($decoded)||!is_array($decoded['sheets']??null)) throw new ApiException('OCR_INVALID_RESPONSE','The OCR provider returned an invalid result.',502);
        return collect($decoded['sheets'])->map(function(array $sheet)use($answerKey,$maxScore){$answers=array_values((array)($sheet['answers']??[]));$correct=0;foreach($answerKey as $i=>$answer)if(strtoupper((string)($answers[$i]??'?'))===strtoupper((string)$answer))$correct++;$score=count($answerKey)?round($correct/count($answerKey)*$maxScore,2):0;return ['admission_number'=>$sheet['admissionNumber']??null,'student_name'=>$sheet['studentName']??null,'answers'=>$answers,'detected_score'=>$score,'confidence'=>max(0,min(100,(float)($sheet['confidence']??0))),'human_review_required'=>(bool)($sheet['humanReviewRequired']??true)||((float)($sheet['confidence']??0)<(float)config('skuggle.ocr.review_threshold',92)),'flag_reason'=>$sheet['flagReason']??null];})->all();
    }
}
