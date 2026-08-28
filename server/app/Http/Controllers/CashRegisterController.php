<?php

namespace App\Http\Controllers;

use App\Exports\RecordsExport;
use App\Http\Requests\CashRegisters\StoreCashRegisterRequest;
use App\Http\Requests\CashRegisters\UpdateCashRegisterRequest;
use App\Http\Resources\CashRegisters\CashRegisterResource;
use App\Models\CashMovement;
use App\Models\CashRegister;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Facades\Excel;

class CashRegisterController extends Controller
{
    public function index(Request $request)
    {
        return CashRegisterResource::collection(CashRegister::query()->filter($request->only(['status']))->sort((string) $request->query('sort_by', 'opened_at'), (string) $request->query('sort_dir', 'desc'))->paginate(max(1, $request->integer('per_page', 10))));
    }

    /** Apertura de caja: no puede existir otra abierta y se fija la fecha del sistema. */
    public function store(StoreCashRegisterRequest $request)
    {
        $data = $request->validated();

        if (CashRegister::where('status', 'open')->exists()) {
            return response()->json(['message' => 'Ya hay una caja abierta.'], 409);
        }

        $caja = CashRegister::create([
            'opened_at' => now(),
            'opening_amount' => $data['opening_amount'],
            'status' => 'open',
        ]);

        return (new CashRegisterResource($caja))->response()->setStatusCode(201);
    }

    public function show(int $id)
    {
        return new CashRegisterResource(CashRegister::findOrFail($id));
    }

    public function update(UpdateCashRegisterRequest $request, int $id)
    {
        $item = CashRegister::findOrFail($id);
        $item->update($request->validated());

        return new CashRegisterResource($item->refresh());
    }

    public function destroy(int $id)
    {
        CashRegister::findOrFail($id)->delete();

        return response()->json(['message' => 'Cash register deleted.']);
    }

    /** Movimientos de la caja, del más reciente al más antiguo. */
    public function movements(int $id)
    {
        $caja = CashRegister::findOrFail($id);

        return response()->json(
            CashMovement::where('cash_register_id', $caja->id)->orderByDesc('occurred_at')->get()
        );
    }

    /** Registra un ingreso o egreso manual (solo si la caja sigue abierta). */
    public function registerMovement(Request $request, int $id)
    {
        $caja = CashRegister::findOrFail($id);
        if ($caja->status !== 'open') {
            return response()->json(['message' => 'La caja no está abierta.'], 409);
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

        return response()->json($movimiento, 201);
    }

    /** Cierre de caja: calcula el monto esperado y devuelve la diferencia contra el monto contado. */
    public function close(Request $request, int $id)
    {
        $caja = CashRegister::findOrFail($id);
        if ($caja->status !== 'open') {
            return response()->json(['message' => 'La caja no está abierta.'], 409);
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

        return response()->json([
            'caja' => $caja,
            'esperado' => (float) $caja->expected_closing_amount,
            'diferencia' => (float) $data['closing_amount'] - (float) $caja->expected_closing_amount,
        ]);
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
