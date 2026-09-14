<?php

namespace Tests\Unit\Support;

use App\Support\PublicStorageUrl;
use PHPUnit\Framework\TestCase;

final class PublicStorageUrlTest extends TestCase
{
    public function test_from_key_prefixes_storage(): void
    {
        $this->assertSame(
            '/storage/tenants/abc/public/branding/logo/logo.png',
            PublicStorageUrl::fromKey('tenants/abc/public/branding/logo/logo.png')
        );
    }

    public function test_relative_strips_absolute_host(): void
    {
        $this->assertSame(
            '/storage/tenants/2/branding/logo.jpg',
            PublicStorageUrl::relative('http://127.0.0.1:8000/storage/tenants/2/branding/logo.jpg')
        );
    }

    public function test_relative_leaves_external_urls(): void
    {
        $this->assertSame(
            'https://cdn.example.com/logo.png',
            PublicStorageUrl::relative('https://cdn.example.com/logo.png')
        );
    }
}
