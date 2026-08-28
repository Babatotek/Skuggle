<?php
namespace App\Models;
use App\Domain\Tenancy\Concerns\BelongsToTenant;
use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
final class SmartmarkBatch extends Model { use BelongsToTenant, HasPublicId; protected $guarded=['id','tenant_id']; protected $hidden=['id','tenant_id','storage_key']; protected function casts():array{return ['answer_key'=>'array'];} public function sheets():HasMany{return $this->hasMany(SmartmarkSheet::class,'batch_id');} }
