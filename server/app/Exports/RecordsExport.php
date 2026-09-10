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

        $this->resolvedCompanyName = $this->companyName
            ?: (\App\Models\Company::first()?->name ?? 'Farmacia Juan de Dios');


        $this->resolvedTitle = $this->title
            ?: $this->resolveReportTitle();
    }


    private function resolveReportTitle(): string
    {
        $path = request()?->path() ?? '';

        $titlesMap = [
            'clients' => 'Reporte de Clientes',
            'categories' => 'Reporte de Categorías',
            'presentations' => 'Reporte de Presentaciones',
            'laboratories' => 'Reporte de Laboratorios',
            'medicaments' => 'Reporte de Medicamentos',
            'batches' => 'Reporte de Lotes',
            'inventory-movements' => 'Reporte de Movimientos de Inventario',
            'suppliers' => 'Reporte de Proveedores',
            'purchases' => 'Reporte de Compras',
            'sales' => 'Reporte de Ventas',
            'invoices' => 'Reporte de Facturación',
            'payment-methods' => 'Reporte de Métodos de Pago',
            'cash-registers' => 'Reporte de Cajas',
            'users' => 'Reporte de Usuarios',
            'roles' => 'Reporte de Roles',
            'companies' => 'Reporte de Datos de la Empresa',
            'audits' => 'Reporte de Auditoría y Actividades',
        ];

        foreach ($titlesMap as $segment => $reportTitle) {
            if (str_contains($path, $segment)) {
                return $reportTitle;
            }
        }


        $firstItem = $this->records->first();
        if ($firstItem instanceof Model) {
            $modelName = class_basename($firstItem);
            $modelMap = [
                'Client' => 'Reporte de Clientes',
                'Category' => 'Reporte de Categorías',
                'Presentation' => 'Reporte de Presentaciones',
                'Laboratory' => 'Reporte de Laboratorios',
                'Medicament' => 'Reporte de Medicamentos',
                'Batch' => 'Reporte de Lotes',
                'InventoryMovement' => 'Reporte de Movimientos de Inventario',
                'Supplier' => 'Reporte de Proveedores',
                'Purchase' => 'Reporte de Compras',
                'Sale' => 'Reporte de Ventas',
                'Invoice' => 'Reporte de Facturación',
                'PaymentMethod' => 'Reporte de Métodos de Pago',
                'CashRegister' => 'Reporte de Cajas',
                'User' => 'Reporte de Usuarios',
                'Role' => 'Reporte de Roles',
                'Company' => 'Reporte de Datos de la Empresa',
                'Audit' => 'Reporte de Auditoría y Actividades',
            ];

            if (isset($modelMap[$modelName])) {
                return $modelMap[$modelName];
            }
        }

        return 'Reporte General';
    }


    public function startCell(): string
    {
        return 'A5';
    }


    public function collection(): Collection
    {
        return $this->records->map(fn($record) => collect($this->columns)
            ->map(fn($column) => data_get($record, $column))
            ->values());
    }


    public function headings(): array
    {
        return array_keys($this->columns);
    }


    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                $totalCols = max(1, count($this->columns));
                $lastCol = Coordinate::stringFromColumnIndex($totalCols);


                $sheet->mergeCells("A1:{$lastCol}1");
                $sheet->setCellValue('A1', $this->resolvedCompanyName);
                $sheet->getStyle('A1')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 16,
                        'color' => ['rgb' => '1a5276'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);
                $sheet->getRowDimension(1)->setRowHeight(28);


                $sheet->mergeCells("A2:{$lastCol}2");
                $sheet->setCellValue('A2', $this->resolvedTitle);
                $sheet->getStyle('A2')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 13,
                        'color' => ['rgb' => '333333'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);
                $sheet->getRowDimension(2)->setRowHeight(22);


                $fechaHora = Carbon::now('America/La_Paz')->format('d/m/Y H:i:s');
                $total = $this->records->count();


                $sheet->setCellValue('A3', 'Fecha de Generación:');
                $sheet->setCellValue('B3', $fechaHora);
                $sheet->getStyle('A3')->getFont()->setBold(true);


                $midColIndex = max(1, intdiv($totalCols, 2) + 1);
                $midCol = Coordinate::stringFromColumnIndex($midColIndex);
                $nextCol = Coordinate::stringFromColumnIndex($midColIndex + 1);

                $sheet->setCellValue("{$midCol}3", 'Total de Registros:');
                $sheet->setCellValue("{$nextCol}3", $total);
                $sheet->getStyle("{$midCol}3")->getFont()->setBold(true);


                $sheet->getRowDimension(4)->setRowHeight(12);


                $headerRange = "A5:{$lastCol}5";
                $sheet->getStyle($headerRange)->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'color' => ['rgb' => 'FFFFFF'],
                        'size' => 10,
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => '1a5276'],
                    ],
                    'alignment' => [
                        'vertical' => Alignment::VERTICAL_CENTER,
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => '0e324d'],
                        ],
                    ],
                ]);
                $sheet->getRowDimension(5)->setRowHeight(22);


                $sheet->setAutoFilter($headerRange);


                if ($this->records->count() > 0) {
                    $lastRow = 5 + $this->records->count();
                    $dataRange = "A6:{$lastCol}{$lastRow}";
                    $sheet->getStyle($dataRange)->applyFromArray([
                        'borders' => [
                            'allBorders' => [
                                'borderStyle' => Border::BORDER_THIN,
                                'color' => ['rgb' => 'D0D0D0'],
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
