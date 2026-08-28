<?php
namespace App\Models;
use App\Domain\Tenancy\Concerns\BelongsToTenant;
use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;
final class SmartmarkSheet extends Model { use BelongsToTenant, HasPublicId; protected $guarded=['id','tenant_id']; protected $hidden=['id','tenant_id','batch_id']; protected function casts():array{return ['answers'=>'array','human_review_required'=>'boolean','reviewed_at'=>'datetime','committed_at'=>'datetime'];} }
