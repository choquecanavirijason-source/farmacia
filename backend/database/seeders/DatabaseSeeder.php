<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolSeeder::class,
            UsuarioSeeder::class,
            EmpresaSeeder::class,
            CategoriaSeeder::class,
            PresentacionSeeder::class,
            LaboratorioSeeder::class,
            FormaPagoSeeder::class,
            MedicamentoSeeder::class,
            ProveedorSeeder::class,
            ClienteSeeder::class,
            LoteSeeder::class,
            CajaSeeder::class,
        ]);
    }
}
