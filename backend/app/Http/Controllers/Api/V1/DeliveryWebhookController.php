<?php
namespace App\Http\Controllers\Api\V1;
use App\Http\Controllers\Controller;
use App\Models\OutboundDelivery;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
final class DeliveryWebhookController extends Controller
{
    public function verifyWhatsapp(Request $request)
    {
        if($request->query('hub.mode')==='subscribe'&&hash_equals((string)config('skuggle.messaging.whatsapp.verify_token'),(string)$request->query('hub.verify_token')))return response((string)$request->query('hub.challenge'),200);
        return response('Forbidden',403);
    }
    public function whatsapp(Request $request):JsonResponse
    {
        $secret=(string)config('skuggle.messaging.whatsapp.app_secret');$signature=(string)$request->header('X-Hub-Signature-256');$expected='sha256='.hash_hmac('sha256',$request->getContent(),$secret);
        if($secret===''||!hash_equals($expected,$signature))return ApiResponse::error('WEBHOOK_UNAUTHORIZED','Invalid WhatsApp webhook signature.',401);
        foreach((array)data_get($request->json()->all(),'entry.0.changes.0.value.statuses',[]) as $status){$reference=(string)($status['id']??'');$state=(string)($status['status']??'');if($reference!==''&&in_array($state,['sent','delivered','read','failed'],true))OutboundDelivery::query()->withoutGlobalScopes()->where('provider_reference',$reference)->update(['status'=>$state,'delivered_at'=>in_array($state,['delivered','read'],true)?now():null,'error_message'=>$state==='failed'?json_encode($status['errors']??[]):null]);}
        return ApiResponse::success(['received'=>true]);
    }
}
