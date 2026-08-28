<?php
namespace App\Http\Controllers\Api\V1;
use App\Http\Controllers\Controller;
use App\Jobs\ProcessSmartmarkBatch;
use App\Models\AssessmentScore;
use App\Models\SmartmarkBatch;
use App\Models\SmartmarkSheet;
use App\Services\UploadSecurityScanner;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
final class SmartmarkController extends Controller
{
    public function index():JsonResponse{return ApiResponse::success(SmartmarkBatch::query()->with('sheets')->latest()->limit(50)->get()->map(fn($b)=>$this->present($b)));}
    public function store(Request $request,UploadSecurityScanner $scanner):JsonResponse
    {
        $data=$request->validate(['file'=>['required','file','mimes:jpg,jpeg,png,webp,pdf','max:20480'],'assessmentId'=>['nullable','string'],'answerKey'=>['required','array','min:1','max:200'],'answerKey.*'=>['required','string','max:2'],'maxScore'=>['required','integer','min:1','max:1000']]);$file=$request->file('file');$scanner->scan($file);$disk=(string)config('skuggle.library.disk');$key='smartmark/'.app(\App\Domain\Tenancy\TenantContext::class)->tenantId().'/'.Str::ulid().'.'.$file->extension();$bytes=file_get_contents($file->getRealPath());Storage::disk($disk)->put($key,$bytes,['visibility'=>'private']);
        $assessment=null;if(!empty($data['assessmentId']))$assessment=\App\Models\Assessment::query()->where('public_id',$data['assessmentId'])->first();
        $batch=SmartmarkBatch::query()->create(['assessment_id'=>$assessment?->getKey(),'created_by'=>$request->user()->getKey(),'state'=>'queued','storage_key'=>$key,'original_filename'=>$file->getClientOriginalName(),'mime_type'=>$file->getMimeType(),'size_bytes'=>$file->getSize(),'sha256'=>hash('sha256',$bytes),'answer_key'=>array_map('strtoupper',$data['answerKey']),'max_score'=>$data['maxScore']]);ProcessSmartmarkBatch::dispatch($batch->getKey(),$batch->tenant_id);return ApiResponse::success($this->present($batch),[],202);
    }
    public function show(string $batch):JsonResponse{$item=SmartmarkBatch::query()->with('sheets')->where('public_id',$batch)->firstOrFail();return ApiResponse::success($this->present($item));}
    public function review(Request $request,string $sheet):JsonResponse{$item=SmartmarkSheet::query()->where('public_id',$sheet)->firstOrFail();$data=$request->validate(['detectedScore'=>['required','numeric','min:0'],'answers'=>['nullable','array'],'approved'=>['required','boolean']]);$item->update(['detected_score'=>$data['detectedScore'],'answers'=>$data['answers']??$item->answers,'human_review_required'=>!$data['approved'],'reviewed_by'=>$request->user()->getKey(),'reviewed_at'=>now()]);return ApiResponse::success($item);}
    public function commit(string $batch,Request $request):JsonResponse
    {
        $item=SmartmarkBatch::query()->with('sheets')->where('public_id',$batch)->firstOrFail();abort_if(!$item->assessment_id,422,'Select an assessment before committing scores.');abort_if($item->sheets->contains(fn($s)=>$s->human_review_required||!$s->student_id),422,'Review every flagged or unmatched sheet before committing.');DB::transaction(function()use($item,$request){foreach($item->sheets as $sheet){AssessmentScore::query()->updateOrCreate(['assessment_id'=>$item->assessment_id,'student_id'=>$sheet->student_id],['score'=>$sheet->detected_score,'status'=>'draft','graded_by'=>$request->user()->getKey(),'graded_at'=>now(),'metadata'=>['source'=>'smartmark','batchId'=>$item->public_id]]);$sheet->update(['committed_at'=>now()]);}$item->update(['state'=>'committed']);});return ApiResponse::success($this->present($item->fresh('sheets')));
    }
    private function present(SmartmarkBatch $b):array{return ['id'=>$b->public_id,'state'=>$b->state,'filename'=>$b->original_filename,'maxScore'=>(int)$b->max_score,'error'=>$b->error_message,'createdAt'=>$b->created_at?->toIso8601String(),'sheets'=>$b->relationLoaded('sheets')?$b->sheets->map(fn($s)=>['id'=>$s->public_id,'studentId'=>$s->student_id,'studentName'=>$s->student_name,'admissionNo'=>$s->admission_number,'answers'=>$s->answers,'detectedScore'=>(float)$s->detected_score,'confidence'=>(float)$s->confidence,'flagged'=>$s->human_review_required,'flagReason'=>$s->flag_reason,'reviewedAt'=>$s->reviewed_at?->toIso8601String()]):[]];}
}
