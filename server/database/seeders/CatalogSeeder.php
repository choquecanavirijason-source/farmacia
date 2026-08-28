<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Client;
use App\Models\Company;
use App\Models\Laboratory;
use App\Models\Medicament;
use App\Models\Presentation;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $categories = Category::factory()->count(100)->create();
        $presentations = Presentation::factory()->count(100)->create();
        $laboratories = Laboratory::factory()->count(100)->create();
        Supplier::factory()->count(100)->create();
        Client::factory()->count(100)->create();
        Medicament::factory()->count(100)->create([
            'laboratory_id' => fn () => $laboratories->random()->id,
            'category_id' => fn () => $categories->random()->id,
            'presentation_id' => fn () => $presentations->random()->id,
        ]);
        Company::factory()->count(100)->create();
    }
}
