<?php

namespace Tests\Unit\Services;

use App\Services\GeoCatalog;
use Tests\TestCase;

class GeoCatalogTest extends TestCase
{
    public function test_nigeria_states_and_lagos_lgas_are_available(): void
    {
        $catalog = app(GeoCatalog::class);

        $states = $catalog->states('NG');
        $this->assertNotEmpty($states);
        $this->assertSame('🇳🇬', $catalog->flagEmoji('NG'));

        $lagos = collect($states)->firstWhere('code', 'lagos');
        $this->assertNotNull($lagos);

        $lgas = $catalog->lgas('NG', 'lagos');
        $this->assertContains('Eti-Osa', $lgas);
    }

    public function test_countries_include_nigeria_and_other(): void
    {
        $catalog = app(GeoCatalog::class);
        $countries = collect($catalog->countries());

        $this->assertTrue($countries->contains(fn (array $country): bool => $country['code'] === 'NG'));
        $this->assertTrue($countries->contains(fn (array $country): bool => $country['code'] === 'OTHER'));
    }
}
