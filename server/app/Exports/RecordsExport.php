<?php

namespace App\Exports;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

/**
 * Clase genérica de exportación para hojas de cálculo Excel (.xlsx).
 *
 * Todo el diseño, nombre de empresa, título, fecha y estilos están encapsulados
 * aquí para no requerir modificaciones en servicios ni controladores existentes.
 */
class RecordsExport implements FromCollection, ShouldAutoSize, WithHeadings, WithCustomStartCell, WithEvents
{
    private string $resolvedTitle;
    private string $resolvedCompanyName;

    public function __construct(
        private readonly Collection $records,
        private readonly array $columns,
        private readonly ?string $title = null,
        private readonly ?string $companyName = null,
    ) {
        // 1. Resolvemos el nombre de la compañía automáticamente si no fue provisto
        $this->resolvedCompanyName = $this->companyName 
            ?: (\App\Models\Company::first()?->name ?? 'Farmacia Juan de Dios');

        // 2. Resolvemos el título del reporte automáticamente si no fue provisto
        $this->resolvedTitle = $this->title 
            ?: $this->resolveReportTitle();
    }

    /**
     * Deduce el título del reporte dinámicamente sin tocar los servicios,
     * utilizando la ruta de la petición actual o el modelo de los registros.
     */
    private function resolveReportTitle(): string
    {
        $path = request()?->path() ?? '';

        $titlesMap = [
            'clients'              => 'Reporte de Clientes',
            'categories'           => 'Reporte de Categorías',
            'presentations'        => 'Reporte de Presentaciones',
            'laboratories'         => 'Reporte de Laboratorios',
            'medicaments'          => 'Reporte de Medicamentos',
            'batches'              => 'Reporte de Lotes',
            'inventory-movements'  => 'Reporte de Movimientos de Inventario',
            'suppliers'            => 'Reporte de Proveedores',
            'purchases'            => 'Reporte de Compras',
            'sales'                => 'Reporte de Ventas',
            'invoices'             => 'Reporte de Facturación',
            'payment-methods'      => 'Reporte de Métodos de Pago',
            'cash-registers'       => 'Reporte de Cajas',
            'users'                => 'Reporte de Usuarios',
            'roles'                => 'Reporte de Roles',
            'companies'            => 'Reporte de Datos de la Empresa',
            'audits'               => 'Reporte de Auditoría y Actividades',
        ];

        foreach ($titlesMap as $segment => $reportTitle) {
            if (str_contains($path, $segment)) {
                return $reportTitle;
            }
        }

        // Si no coincide con la ruta, intentamos deducirlo por el modelo Eloquent
        $firstItem = $this->records->first();
        if ($firstItem instanceof Model) {
            $modelName = class_basename($firstItem);
            $modelMap = [
                'Client'            => 'Reporte de Clientes',
                'Category'          => 'Reporte de Categorías',
                'Presentation'      => 'Reporte de Presentaciones',
                'Laboratory'        => 'Reporte de Laboratorios',
                'Medicament'        => 'Reporte de Medicamentos',
                'Batch'             => 'Reporte de Lotes',
                'InventoryMovement' => 'Reporte de Movimientos de Inventario',
                'Supplier'          => 'Reporte de Proveedores',
                'Purchase'          => 'Reporte de Compras',
                'Sale'              => 'Reporte de Ventas',
                'Invoice'           => 'Reporte de Facturación',
                'PaymentMethod'     => 'Reporte de Métodos de Pago',
                'CashRegister'      => 'Reporte de Cajas',
                'User'              => 'Reporte de Usuarios',
                'Role'              => 'Reporte de Roles',
                'Company'           => 'Reporte de Datos de la Empresa',
                'Audit'             => 'Reporte de Auditoría y Actividades',
            ];

            if (isset($modelMap[$modelName])) {
                return $modelMap[$modelName];
            }
        }

        return 'Reporte General';
    }

    /**
     * Define que los datos y encabezados de tabla inicien en la fila A5,
     * dejando libres las filas 1 a 4 para el bloque de información general.
     */
    public function startCell(): string
    {
        return 'A5';
    }

    /**
     * Colección de datos mapeados según las columnas requeridas.
     */
    public function collection(): Collection
    {
        return $this->records->map(fn ($record) => collect($this->columns)
            ->map(fn ($column) => data_get($record, $column))
            ->values());
    }

    /**
     * Nombres de columnas que se mostrarán en la fila 5.
     */
    public function headings(): array
    {
        return array_keys($this->columns);
    }

    /**
     * Eventos de hoja para estructurar el encabezado visual superior y estilos de tabla.
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                $totalCols = max(1, count($this->columns));
                $lastCol = Coordinate::stringFromColumnIndex($totalCols);

                // =====================================================
                // FILA 1: Nombre de la Empresa (Centrado, tamaño 16, azul)
                // =====================================================
                $sheet->mergeCells("A1:{$lastCol}1");
                $sheet->setCellValue('A1', $this->resolvedCompanyName);
                $sheet->getStyle('A1')->applyFromArray([
                    'font' => [
                        'bold'  => true,
                        'size'  => 16,
                        'color' => ['rgb' => '1a5276'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical'   => Alignment::VERTICAL_CENTER,
                    ],
                ]);
                $sheet->getRowDimension(1)->setRowHeight(28);

                // =====================================================
                // FILA 2: Título del Reporte (Centrado, tamaño 13)
                // =====================================================
                $sheet->mergeCells("A2:{$lastCol}2");
                $sheet->setCellValue('A2', $this->resolvedTitle);
                $sheet->getStyle('A2')->applyFromArray([
                    'font' => [
                        'bold'  => true,
                        'size'  => 13,
                        'color' => ['rgb' => '333333'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical'   => Alignment::VERTICAL_CENTER,
                    ],
                ]);
                $sheet->getRowDimension(2)->setRowHeight(22);

                // =====================================================
                // FILA 3: Metadatos (Fecha/Hora y Total de Registros)
                // =====================================================
                $fechaHora = Carbon::now('America/La_Paz')->format('d/m/Y H:i:s');
                $total = $this->records->count();

                // Lado izquierdo: Fecha de generación
                $sheet->setCellValue('A3', 'Fecha de Generación:');
                $sheet->setCellValue('B3', $fechaHora);
                $sheet->getStyle('A3')->getFont()->setBold(true);

                // Lado derecho: Total de registros ubicado hacia la mitad derecha de las columnas
                $midColIndex = max(1, intdiv($totalCols, 2) + 1);
                $midCol = Coordinate::stringFromColumnIndex($midColIndex);
                $nextCol = Coordinate::stringFromColumnIndex($midColIndex + 1);

                $sheet->setCellValue("{$midCol}3", 'Total de Registros:');
                $sheet->setCellValue("{$nextCol}3", $total);
                $sheet->getStyle("{$midCol}3")->getFont()->setBold(true);

                // Fila 4 se mantiene como espacio separador visual
                $sheet->getRowDimension(4)->setRowHeight(12);

                // =====================================================
                // FILA 5: Estilo para Encabezados de Columna y Filtros
                // =====================================================
                $headerRange = "A5:{$lastCol}5";
                $sheet->getStyle($headerRange)->applyFromArray([
                    'font' => [
                        'bold'  => true,
                        'color' => ['rgb' => 'FFFFFF'],
                        'size'  => 10,
                    ],
                    'fill' => [
                        'fillType'   => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => '1a5276'],
                    ],
                    'alignment' => [
                        'vertical'   => Alignment::VERTICAL_CENTER,
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color'       => ['rgb' => '0e324d'],
                        ],
                    ],
                ]);
                $sheet->getRowDimension(5)->setRowHeight(22);

                // Habilita los botones/flechas de filtro desplegable en cada columna
                $sheet->setAutoFilter($headerRange);

                // =====================================================
                // FILAS 6+: Bordes y alineación de datos
                // =====================================================
                if ($this->records->count() > 0) {
                    $lastRow = 5 + $this->records->count();
                    $dataRange = "A6:{$lastCol}{$lastRow}";
                    $sheet->getStyle($dataRange)->applyFromArray([
                        'borders' => [
                            'allBorders' => [
                                'borderStyle' => Border::BORDER_THIN,
                                'color'       => ['rgb' => 'D0D0D0'],
                            ],
                        ],
                        'alignment' => [
                            'vertical' => Alignment::VERTICAL_CENTER,
                        ],
                    ]);
                }
            },
        ];
    }
}
