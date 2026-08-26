<?php

namespace App\Models;

use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlatformSupportMessage extends Model
{
    use HasPublicId;

    protected $guarded = ['id'];

    protected $hidden = ['id'];

    protected function casts(): array
    {
        return ['attachments' => 'array'];
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(PlatformSupportTicket::class, 'ticket_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_user_id');
    }
}
