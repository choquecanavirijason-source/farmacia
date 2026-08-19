<?php

namespace Database\Seeders;

use App\Models\FormaPago;
use Illuminate\Database\Seeder;

class FormaPagoSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['Efectivo', 'Tarjeta', 'QR', 'Transferencia'] as $nombre) {
            FormaPago::create(['nombre' => $nombre, 'estado' => 'activo']);
        }
    }
}
