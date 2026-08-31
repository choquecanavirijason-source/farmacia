<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;

class RecordsExport implements FromCollection, ShouldAutoSize, WithHeadings
{
    public function __construct(
        private readonly Collection $records,
        private readonly array $columns,
    ) {}

    public function collection(): Collection
    {
        return $this->records->map(fn ($record) => collect($this->columns)
            ->map(fn ($column) => data_get($record, $column))
            ->values());
    }

    public function headings(): array
    {
        return array_keys($this->columns);
    }
}
