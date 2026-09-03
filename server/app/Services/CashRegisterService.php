<?php

namespace App\Services;

use App\Exports\RecordsExport;
use App\Models\CashMovement;
use App\Models\CashRegister;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

class CashRegisterService
{
    public function getCurrent(?int $branchId = null): ?CashRegister
    {
        return CashRegister::with('movements')
            ->where('status', 'open')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->latest('opened_at')
            ->first();
    }

    public function getPaginated(array $filters, int $perPage = 10, string $sortBy = 'opened_at', string $sortDir = 'desc'): LengthAwarePaginator
    {
        return CashRegister::with('branch')
            ->filter($filters)
            ->sort($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function open(float $openingAmount, int $branchId): CashRegister
    {
        if (CashRegister::where('status', 'open')->where('branch_id', $branchId)->exists()) {
            throw new HttpException(409, 'Ya hay una caja abierta en esta sucursal.');
        }

        return CashRegister::create([
            'opened_at'      => now(),
            'opening_amount' => $openingAmount,
            'status'         => 'open',
            'branch_id'      => $branchId,
        ]);
    }

    public function update(CashRegister $cashRegister, array $data): CashRegister
    {
        $cashRegister->update($data);
        return $cashRegister->refresh();
    }

    public function delete(int $id): void
    {
        CashRegister::findOrFail($id)->delete();
    }

    public function getMovements(int $cashRegisterId): Collection
    {
        $cashRegister = CashRegister::findOrFail($cashRegisterId);
        return CashMovement::where('cash_register_id', $cashRegister->id)->orderByDesc('occurred_at')->get();
    }

    public function registerMovement(int $cashRegisterId, string $type, float $amount, string $description): CashMovement
    {
        $cashRegister = CashRegister::findOrFail($cashRegisterId);
        if ($cashRegister->status !== 'open') {
            throw new HttpException(409, 'La caja no está abierta.');
        }

        return CashMovement::create([
            'cash_register_id' => $cashRegister->id,
            'type'             => $type,
            'amount'           => $amount,
            'description'      => trim($description),
            'occurred_at'      => now(),
        ]);
    }

    public function close(int $cashRegisterId, float $closingAmount): array
    {
        $cashRegister = CashRegister::findOrFail($cashRegisterId);
        if ($cashRegister->status !== 'open') {
            throw new HttpException(409, 'La caja no está abierta.');
        }

        return DB::transaction(function () use ($cashRegister, $closingAmount) {
            $expectedAmount = (float) $cashRegister->opening_amount
                + (float) CashMovement::where('cash_register_id', $cashRegister->id)->where('type', 'income')->sum('amount')
                - (float) CashMovement::where('cash_register_id', $cashRegister->id)->where('type', 'expense')->sum('amount');

            $cashRegister->update([
                'closed_at'               => now(),
                'closing_amount'          => $closingAmount,
                'expected_closing_amount' => $expectedAmount,
                'status'                  => 'closed',
            ]);

            return [
                'caja'       => $cashRegister,
                'esperado'   => (float) $cashRegister->expected_closing_amount,
                'diferencia' => (float) $closingAmount - (float) $cashRegister->expected_closing_amount,
            ];
        });
    }

    public function export(string $format): Response
    {
        $items = CashRegister::with('user')->orderByDesc('opened_at')->get();
        $columns = [
            'ID'                  => 'id',
            'Fecha Apertura'      => 'opened_at',
            'Monto Apertura (Bs)' => 'opening_amount',
            'Fecha Cierre'        => 'closed_at',
            'Monto Cierre (Bs)'   => 'closing_amount',
            'Estado'              => 'status',
        ];

        return strtolower($format) === 'pdf'
            ? Pdf::loadView('exports.records', ['title' => 'Reporte de Cajas', 'columns' => $columns, 'records' => $items])->download('cajas.pdf')
            : Excel::download(new RecordsExport($items, $columns), 'cajas.xlsx');
    }
}
