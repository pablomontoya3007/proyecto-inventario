<?php

namespace Database\Seeders;

use App\Models\Responsable;
use Illuminate\Database\Seeder;

class ResponsableSeeder extends Seeder
{
    public function run(): void
    {
        Responsable::factory()->count(20)->create();
    }
}
