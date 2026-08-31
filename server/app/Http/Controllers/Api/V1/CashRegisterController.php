<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\RecordsExport;
use App\Http\Requests\CashRegisters\StoreCashRegisterRequest;
use App\Http\Requests\CashRegisters\UpdateCashRegisterRequest;
use App\Http\Resources\CashRegisters\CashRegisterResource;
use App\Models\CashMovement;
use App\Models\CashRegister;
use App\Traits\ApiResponseTrait;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Facades\Excel;

class CashRegisterController
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        $registers = CashRegister::query()->filter($request->only(['status']))->sort((string) $request->query('sort_by', 'opened_at'), (string) $request->query('sort_dir', 'desc'))->paginate(max(1, $request->integer('per_page', 10)));

        return $this->collectionResponse(CashRegisterResource::collection($registers), 'Registros de caja obtenidos con éxito.');
    }

    public function store(StoreCashRegisterRequest $request)
    {
        $data = $request->validated();

        if (CashRegister::where('status', 'open')->exists()) {
            return $this->errorResponse('Ya hay una caja abierta.', 409);
        }

        $caja = CashRegister::create([
            'opened_at' => now(),
            'opening_amount' => $data['opening_amount'],
            'status' => 'open',
        ]);

        return $this->createdResponse(new CashRegisterResource($caja), 'Caja abierta con éxito.');
    }

    public function show(int $id)
    {
        return $this->resourceResponse(new CashRegisterResource(CashRegister::findOrFail($id)), 'Información de la caja obtenida con éxito.');
    }

    public function update(UpdateCashRegisterRequest $request, int $id)
    {
        $item = CashRegister::findOrFail($id);
        $item->update($request->validated());

        return $this->updatedResponse(new CashRegisterResource($item->refresh()), 'Caja actualizada con éxito.');
    }

    public function destroy(int $id)
    {
        CashRegister::findOrFail($id)->delete();

        return $this->deletedResponse('Caja eliminada con éxito.');
    }

    public function movements(int $id)
    {
        $caja = CashRegister::findOrFail($id);

        $movements = CashMovement::where('cash_register_id', $caja->id)->orderByDesc('occurred_at')->get();

        return $this->successResponse($movements, 'Movimientos de caja obtenidos con éxito.');
    }

    public function registerMovement(Request $request, int $id)
    {
        $caja = CashRegister::findOrFail($id);
        if ($caja->status !== 'open') {
            return $this->errorResponse('La caja no está abierta.', 409);
        }

        $data = $request->validate([
            'type' => ['required', Rule::in(['income', 'expense'])],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['required', 'string', 'max:150'],
        ]);

        $movimiento = CashMovement::create([
            'cash_register_id' => $caja->id,
            'type' => $data['type'],
            'amount' => $data['amount'],
            'description' => trim($data['description']),
            'occurred_at' => now(),
        ]);

        return $this->createdResponse($movimiento, 'Movimiento de caja registrado con éxito.');
    }

    public function close(Request $request, int $id)
    {
        $caja = CashRegister::findOrFail($id);
        if ($caja->status !== 'open') {
            return $this->errorResponse('La caja no está abierta.', 409);
        }

        $data = $request->validate([
            'closing_amount' => ['required', 'numeric', 'min:0'],
        ]);

        $caja = DB::transaction(function () use ($caja, $data) {
            $esperado = (float) $caja->opening_amount
                + (float) CashMovement::where('cash_register_id', $caja->id)->where('type', 'income')->sum('amount')
                - (float) CashMovement::where('cash_register_id', $caja->id)->where('type', 'expense')->sum('amount');

            $caja->update([
                'closed_at' => now(),
                'closing_amount' => $data['closing_amount'],
                'expected_closing_amount' => $esperado,
                'status' => 'closed',
            ]);

            return $caja;
        });

        return $this->successResponse([
            'caja' => $caja,
            'esperado' => (float) $caja->expected_closing_amount,
            'diferencia' => (float) $data['closing_amount'] - (float) $caja->expected_closing_amount,
        ], 'Caja cerrada con éxito.');
    }

    public function export(Request $request)
    {
        $items = CashRegister::orderByDesc('opened_at')->get();
        $c = ['Opened at' => 'opened_at', 'Opening amount' => 'opening_amount', 'Closed at' => 'closed_at', 'Closing amount' => 'closing_amount', 'Status' => 'status'];
        if ($request->query('format') === 'pdf') {
            return Pdf::loadView('exports.records', ['title' => 'Cash registers', 'columns' => $c, 'records' => $items])->download('cash-registers.pdf');
        }

        return Excel::download(new RecordsExport($items, $c), 'cash-registers.xlsx');
    }
}
