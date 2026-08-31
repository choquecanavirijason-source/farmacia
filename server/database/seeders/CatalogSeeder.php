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
        // 1. Empresa Principal (Cochabamba, Bolivia)
        Company::updateOrCreate(
            ['id' => 1],
            [
                'name' => 'Farmacia Juan de Dios',
                'nit' => '1028374029',
                'address' => 'Av. Heroínas #456 esq. San Martín, Cochabamba, Bolivia',
                'phone' => '44251234',
                'email' => 'contacto@farmaciajuandedios.bo',
            ]
        );

        // 2. Laboratorios Farmacéuticos Reales en Bolivia
        $laboratoriosData = [
            ['name' => 'Laboratorios Bagó de Bolivia S.A.', 'country' => 'Bolivia', 'phone' => '44452100'],
            ['name' => 'Droguería INTI S.A.', 'country' => 'Bolivia', 'phone' => '44289000'],
            ['name' => 'Laboratorios COFAR S.A.', 'country' => 'Bolivia', 'phone' => '44234500'],
            ['name' => 'Laboratorios VITA S.A.', 'country' => 'Bolivia', 'phone' => '44258900'],
            ['name' => 'Terbol S.A.', 'country' => 'Bolivia', 'phone' => '44501230'],
            ['name' => 'IFA Laboratorios', 'country' => 'Bolivia', 'phone' => '44290110'],
            ['name' => 'Sigma Corp S.R.L.', 'country' => 'Bolivia', 'phone' => '44302910'],
            ['name' => 'Laboratorios ALCOS S.A.', 'country' => 'Bolivia', 'phone' => '44129830'],
            ['name' => 'Bayer Boliviana Ltda.', 'country' => 'Alemania / Bolivia', 'phone' => '44891020'],
            ['name' => 'Roemmers Bolivia', 'country' => 'Argentina / Bolivia', 'phone' => '44901280'],
        ];
        $labs = [];
        foreach ($laboratoriosData as $lab) {
            $labs[$lab['name']] = Laboratory::firstOrCreate(['name' => $lab['name']], $lab);
        }

        // 3. Categorías Farmacéuticas Reales
        $categoriasData = [
            ['name' => 'Analgésicos y Antiinflamatorios', 'description' => 'Para dolor, inflamación y fiebre'],
            ['name' => 'Antibióticos y Antimicrobianos', 'description' => 'Tratamiento de infecciones bacterianas'],
            ['name' => 'Antigripales y Respiratorios', 'description' => 'Tratamiento de resfríos, gripe y tos'],
            ['name' => 'Digestivos y Antiácidos', 'description' => 'Gastritis, reflujo, digestión y cólicos'],
            ['name' => 'Antihistamínicos y Antialérgicos', 'description' => 'Tratamiento de alergias y rinitis'],
            ['name' => 'Cardiovascular y Presión', 'description' => 'Antihipertensivos y cuidado cardíaco'],
            ['name' => 'Vitaminas y Suplementos', 'description' => 'Complejo vitamínico y minerales'],
            ['name' => 'Dermatológicos y Antisépticos', 'description' => 'Cuidado de la piel, heridas y quemaduras'],
            ['name' => 'Pediatría e Infantil', 'description' => 'Formulaciones especiales para niños'],
            ['name' => 'Primeros Auxilios y Curación', 'description' => 'Algodón, gasas, vendas y jeringas'],
        ];
        $cats = [];
        foreach ($categoriasData as $cat) {
            $cats[$cat['name']] = Category::firstOrCreate(['name' => $cat['name']], $cat);
        }

        // 4. Presentaciones Farmacéuticas
        $presentacionesData = [
            ['name' => 'Caja x 20 Comprimidos', 'description' => 'Blíster con 20 comprimidos recubiertos'],
            ['name' => 'Caja x 30 Cápsulas', 'description' => 'Cápsulas blandas / duras'],
            ['name' => 'Jarabe Frasco 120 ml', 'description' => 'Solución oral infantil / adultos'],
            ['name' => 'Suspensión Frasco 60 ml', 'description' => 'Polvo para suspensión oral'],
            ['name' => 'Tubo Pomada / Gel 30 g', 'description' => 'Uso tópico dérmico'],
            ['name' => 'Tubo Crema 50 g', 'description' => 'Uso tópico'],
            ['name' => 'Ampolla Inyectable 2 ml (Caja x 5)', 'description' => 'Vía intramuscular / endovenosa'],
            ['name' => 'Gotas Frasco 15 ml', 'description' => 'Solución ótica / oftálmica / oral'],
            ['name' => 'Sobres Efervescentes (Caja x 10)', 'description' => 'Polvo soluble para bebida'],
            ['name' => 'Frasco Solución 100 ml', 'description' => 'Antiséptico / desinfectante'],
            ['name' => 'Unidad / Paquete', 'description' => 'Material médico o artículo individual'],
        ];
        $pres = [];
        foreach ($presentacionesData as $p) {
            $pres[$p['name']] = Presentation::firstOrCreate(['name' => $p['name']], $p);
        }

        // 5. Proveedores Reales en Cochabamba / Bolivia
        $proveedoresData = [
            [
                'name' => 'Droguería INTI Distribuciones',
                'nit' => '1020304050',
                'phone' => '44289000',
                'email' => 'pedidos.cbba@inti.com.bo',
                'address' => 'Av. Blanco Galindo Km 4, Cochabamba',
            ],
            [
                'name' => 'Distribuidora Farmacéutica Bagó Bolivia',
                'nit' => '1015243021',
                'phone' => '44452100',
                'email' => 'pedidos@bago.com.bo',
                'address' => 'Av. América Este #123, Cochabamba',
            ],
            [
                'name' => 'Distrifar S.R.L. Cochabamba',
                'nit' => '1029384756',
                'phone' => '44258900',
                'email' => 'ventas@distrifar.bo',
                'address' => 'Calle Jordán #789, Cochabamba',
            ],
            [
                'name' => 'Laboratorios COFAR Sucursal Cochabamba',
                'nit' => '1003948572',
                'phone' => '44234500',
                'email' => 'distribucion.cbba@cofar.com.bo',
                'address' => 'Av. Villazón Km 2, Sacaba - Cochabamba',
            ],
            [
                'name' => 'Droguería Santa María Cbba',
                'nit' => '1009283741',
                'phone' => '44410290',
                'email' => 'contacto@santamaria.com.bo',
                'address' => 'Av. Melchor Pérez de Olguín #890, Cochabamba',
            ],
        ];
        foreach ($proveedoresData as $prov) {
            Supplier::firstOrCreate(['nit' => $prov['nit']], $prov);
        }

        // 6. Clientes Frecuentes Reales en Cochabamba
        $clientesData = [
            ['firstname' => 'María Eugenia', 'lastname' => 'Flores Montaño', 'ci' => '5283941', 'nit' => '5283941012', 'phone' => '72234567', 'address' => 'Av. América #450'],
            ['firstname' => 'Carlos Alberto', 'lastname' => 'Mamani Quispe', 'ci' => '7892134', 'nit' => '7892134015', 'phone' => '71456789', 'address' => 'Calle Calama #230'],
            ['firstname' => 'Rosa Elena', 'lastname' => 'Claros Torrico', 'ci' => '4920183', 'nit' => '4920183011', 'phone' => '79789012', 'address' => 'Av. Circunvalación #102'],
            ['firstname' => 'Juan Carlos', 'lastname' => 'Rodríguez Vargas', 'ci' => '6719284', 'nit' => '6719284018', 'phone' => '68512345', 'address' => 'Av. Heroínas #890'],
            ['firstname' => 'Patricia', 'lastname' => 'Guzmán Soliz', 'ci' => '5192830', 'nit' => '5192830014', 'phone' => '70712399', 'address' => 'Calle España #567'],
            ['firstname' => 'Fernando', 'lastname' => 'Rocha Torrico', 'ci' => '8392014', 'nit' => '8392014019', 'phone' => '76901234', 'address' => 'Av. Beijing #1204'],
            ['firstname' => 'Clínica Los Olivos', 'lastname' => 'S.A.', 'ci' => null, 'nit' => '1029384029', 'phone' => '44291020', 'address' => 'Av. América Oeste #77'],
            ['firstname' => 'Consultorio Médico', 'lastname' => 'San Lucas', 'ci' => null, 'nit' => '1019283745', 'phone' => '44521030', 'address' => 'Calle Baptista #340'],
            ['firstname' => 'Sandra', 'lastname' => 'Villarroel Encinas', 'ci' => '4819203', 'nit' => '4819203010', 'phone' => '71789023', 'address' => 'Calle Esteban Arze #412'],
            ['firstname' => 'Luis Marcelo', 'lastname' => 'Alcocer Terrazas', 'ci' => '7291048', 'nit' => '7291048016', 'phone' => '72738491', 'address' => 'Av. D’Orbigny #345'],
        ];
        foreach ($clientesData as $cli) {
            Client::firstOrCreate(
                ['firstname' => $cli['firstname'], 'lastname' => $cli['lastname']],
                $cli
            );
        }

        // 7. Catálogo Real de Medicamentos Populares en Bolivia (Precios en Bolivianos - Bs.)
        $medicamentosData = [
            [
                'code' => 'MED-001',
                'name' => 'Paracetamol 500 mg',
                'concentration' => '500 mg',
                'price' => 1.00,
                'min_stock' => 50,
                'requires_prescription' => false,
                'category' => 'Analgésicos y Antiinflamatorios',
                'laboratory' => 'Droguería INTI S.A.',
                'presentation' => 'Caja x 20 Comprimidos',
            ],
            [
                'code' => 'MED-002',
                'name' => 'Ibuprofeno 400 mg',
                'concentration' => '400 mg',
                'price' => 1.50,
                'min_stock' => 40,
                'requires_prescription' => false,
                'category' => 'Analgésicos y Antiinflamatorios',
                'laboratory' => 'Laboratorios Bagó de Bolivia S.A.',
                'presentation' => 'Caja x 20 Comprimidos',
            ],
            [
                'code' => 'MED-003',
                'name' => 'Mentisan Ungüento 25 g',
                'concentration' => 'Fórmula Tradicional',
                'price' => 12.00,
                'min_stock' => 30,
                'requires_prescription' => false,
                'category' => 'Antigripales y Respiratorios',
                'laboratory' => 'Droguería INTI S.A.',
                'presentation' => 'Tubo Pomada / Gel 30 g',
            ],
            [
                'code' => 'MED-004',
                'name' => 'Tapsin Día y Noche Sobres',
                'concentration' => 'Paracetamol + Antigripal',
                'price' => 4.00,
                'min_stock' => 50,
                'requires_prescription' => false,
                'category' => 'Antigripales y Respiratorios',
                'laboratory' => 'Laboratorios Bagó de Bolivia S.A.',
                'presentation' => 'Sobres Efervescentes (Caja x 10)',
            ],
            [
                'code' => 'MED-005',
                'name' => 'Amoxicilina + Ácido Clavulánico 875/125 mg',
                'concentration' => '875 mg / 125 mg',
                'price' => 7.50,
                'min_stock' => 25,
                'requires_prescription' => true,
                'category' => 'Antibióticos y Antimicrobianos',
                'laboratory' => 'Laboratorios COFAR S.A.',
                'presentation' => 'Caja x 20 Comprimidos',
            ],
            [
                'code' => 'MED-006',
                'name' => 'Azitromicina 500 mg',
                'concentration' => '500 mg',
                'price' => 8.00,
                'min_stock' => 20,
                'requires_prescription' => true,
                'category' => 'Antibióticos y Antimicrobianos',
                'laboratory' => 'Laboratorios COFAR S.A.',
                'presentation' => 'Caja x 20 Comprimidos',
            ],
            [
                'code' => 'MED-007',
                'name' => 'Omeprazol 20 mg Cápsulas',
                'concentration' => '20 mg',
                'price' => 2.00,
                'min_stock' => 45,
                'requires_prescription' => false,
                'category' => 'Digestivos y Antiácidos',
                'laboratory' => 'Terbol S.A.',
                'presentation' => 'Caja x 30 Cápsulas',
            ],
            [
                'code' => 'MED-008',
                'name' => 'Digestan Compuesto',
                'concentration' => 'Enzimas + Antiflatulento',
                'price' => 2.50,
                'min_stock' => 35,
                'requires_prescription' => false,
                'category' => 'Digestivos y Antiácidos',
                'laboratory' => 'Laboratorios VITA S.A.',
                'presentation' => 'Caja x 30 Cápsulas',
            ],
            [
                'code' => 'MED-009',
                'name' => 'Bismutol Suspensión 150 ml',
                'concentration' => 'Subsalicilato de Bismuto 262 mg/15 ml',
                'price' => 28.00,
                'min_stock' => 15,
                'requires_prescription' => false,
                'category' => 'Digestivos y Antiácidos',
                'laboratory' => 'Laboratorios Bagó de Bolivia S.A.',
                'presentation' => 'Jarabe Frasco 120 ml',
            ],
            [
                'code' => 'MED-010',
                'name' => 'Loratadina 10 mg',
                'concentration' => '10 mg',
                'price' => 1.20,
                'min_stock' => 30,
                'requires_prescription' => false,
                'category' => 'Antihistamínicos y Antialérgicos',
                'laboratory' => 'Laboratorios VITA S.A.',
                'presentation' => 'Caja x 20 Comprimidos',
            ],
            [
                'code' => 'MED-011',
                'name' => 'Cetirizina Jarabe 60 ml',
                'concentration' => '5 mg / 5 ml',
                'price' => 22.00,
                'min_stock' => 12,
                'requires_prescription' => false,
                'category' => 'Antihistamínicos y Antialérgicos',
                'laboratory' => 'Terbol S.A.',
                'presentation' => 'Jarabe Frasco 120 ml',
            ],
            [
                'code' => 'MED-012',
                'name' => 'Losartán Potásico 50 mg',
                'concentration' => '50 mg',
                'price' => 1.80,
                'min_stock' => 40,
                'requires_prescription' => true,
                'category' => 'Cardiovascular y Presión',
                'laboratory' => 'IFA Laboratorios',
                'presentation' => 'Caja x 30 Cápsulas',
            ],
            [
                'code' => 'MED-013',
                'name' => 'Metformina 850 mg',
                'concentration' => '850 mg',
                'price' => 2.20,
                'min_stock' => 35,
                'requires_prescription' => true,
                'category' => 'Cardiovascular y Presión',
                'laboratory' => 'Sigma Corp S.R.L.',
                'presentation' => 'Caja x 30 Cápsulas',
            ],
            [
                'code' => 'MED-014',
                'name' => 'Complejo B Forte Jarabe 200 ml',
                'concentration' => 'Vitaminas B1, B6, B12',
                'price' => 24.00,
                'min_stock' => 15,
                'requires_prescription' => false,
                'category' => 'Vitaminas y Suplementos',
                'laboratory' => 'Laboratorios VITA S.A.',
                'presentation' => 'Jarabe Frasco 120 ml',
            ],
            [
                'code' => 'MED-015',
                'name' => 'Vitamina C 1000 mg Efervescente',
                'concentration' => '1000 mg + Zinc',
                'price' => 3.50,
                'min_stock' => 50,
                'requires_prescription' => false,
                'category' => 'Vitaminas y Suplementos',
                'laboratory' => 'Laboratorios Bagó de Bolivia S.A.',
                'presentation' => 'Sobres Efervescentes (Caja x 10)',
            ],
            [
                'code' => 'MED-016',
                'name' => 'Neurobión 25.000 Ampolla Inyectable',
                'concentration' => 'B1 + B6 + B12 25000 mcg',
                'price' => 45.00,
                'min_stock' => 10,
                'requires_prescription' => true,
                'category' => 'Vitaminas y Suplementos',
                'laboratory' => 'Bayer Boliviana Ltda.',
                'presentation' => 'Ampolla Inyectable 2 ml (Caja x 5)',
            ],
            [
                'code' => 'MED-017',
                'name' => 'Diclofenaco Sódico 75 mg Inyectable',
                'concentration' => '75 mg / 3 ml',
                'price' => 8.50,
                'min_stock' => 20,
                'requires_prescription' => true,
                'category' => 'Analgésicos y Antiinflamatorios',
                'laboratory' => 'Droguería INTI S.A.',
                'presentation' => 'Ampolla Inyectable 2 ml (Caja x 5)',
            ],
            [
                'code' => 'MED-018',
                'name' => 'Povidona Yodada Antiséptico 100 ml',
                'concentration' => '10% Solución Dérmica',
                'price' => 15.00,
                'min_stock' => 18,
                'requires_prescription' => false,
                'category' => 'Dermatológicos y Antisépticos',
                'laboratory' => 'IFA Laboratorios',
                'presentation' => 'Frasco Solución 100 ml',
            ],
            [
                'code' => 'MED-019',
                'name' => 'Antalgina Jarabe Pediátrico 100 ml',
                'concentration' => 'Metamizol Sódico 250 mg/5 ml',
                'price' => 19.50,
                'min_stock' => 15,
                'requires_prescription' => false,
                'category' => 'Pediatría e Infantil',
                'laboratory' => 'Laboratorios COFAR S.A.',
                'presentation' => 'Jarabe Frasco 120 ml',
            ],
            [
                'code' => 'MED-020',
                'name' => 'Alcohol en Gel 70% 500 ml',
                'concentration' => 'Alcohol Etílico 70°',
                'price' => 18.00,
                'min_stock' => 25,
                'requires_prescription' => false,
                'category' => 'Primeros Auxilios y Curación',
                'laboratory' => 'Laboratorios VITA S.A.',
                'presentation' => 'Frasco Solución 100 ml',
            ],
        ];

        foreach ($medicamentosData as $m) {
            $catId = $cats[$m['category']]->id;
            $labId = $labs[$m['laboratory']]->id;
            $presId = $pres[$m['presentation']]->id;

            Medicament::firstOrCreate(
                ['code' => $m['code']],
                [
                    'name' => $m['name'],
                    'concentration' => $m['concentration'],
                    'price' => $m['price'],
                    'min_stock' => $m['min_stock'],
                    'requires_prescription' => $m['requires_prescription'],
                    'category_id' => $catId,
                    'laboratory_id' => $labId,
                    'presentation_id' => $presId,
                ]
            );
        }
    }
}
