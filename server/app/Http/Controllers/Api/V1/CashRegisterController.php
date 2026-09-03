<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\CashRegisters\StoreCashRegisterRequest;
use App\Http\Requests\CashRegisters\UpdateCashRegisterRequest;
use App\Http\Requests\PaginationRequest;
use App\Http\Resources\CashRegisters\CashRegisterResource;
use App\Models\CashRegister;
use App\Services\CashRegisterService;
use App\Traits\ApiResponseTrait;
use App\Traits\ResolvesBranchScope;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CashRegisterController
{
    use ApiResponseTrait, ResolvesBranchScope;

    public function __construct(
        protected CashRegisterService $cashRegisterService
    ) {}

    public function current(Request $request)
    {
        $cashRegister = $this->cashRegisterService->getCurrent($request->user()->active_branch_id);
        if (!$cashRegister) {
            return $this->successResponse(null, 'No hay caja abierta actualmente.');
        }

        return $this->resourceResponse(new CashRegisterResource($cashRegister), 'Caja actual obtenida con éxito.');
    }

    public function index(PaginationRequest $request)
    {
        $filters = $request->getFilters(['status']);
        $filters['branch_id'] = $this->resolveBranchScope($request);

        $result = $this->cashRegisterService->getPaginated(
            $filters,
            $request->getPerPage(10),
            $request->getSortBy('opened_at'),
            $request->getSortDir('desc')
        );

        return $this->collectionResponse(CashRegisterResource::collection($result), 'Registros de caja obtenidos con éxito.');
    }

    public function store(StoreCashRegisterRequest $request)
    {
        $data = $request->validated();
        $cashRegister = $this->cashRegisterService->open((float) $data['opening_amount'], (int) $request->user()->active_branch_id);
        return $this->createdResponse(new CashRegisterResource($cashRegister), 'Caja abierta con éxito.');
    }

    public function show(int $id)
    {
        $cashRegister = CashRegister::findOrFail($id);
        return $this->resourceResponse(new CashRegisterResource($cashRegister), 'Información de la caja obtenida con éxito.');
    }

    public function update(UpdateCashRegisterRequest $request, int $id)
    {
        $cashRegister = CashRegister::findOrFail($id);
        $updatedCashRegister = $this->cashRegisterService->update($cashRegister, $request->validated());
        return $this->updatedResponse(new CashRegisterResource($updatedCashRegister), 'Caja actualizada con éxito.');
    }

    public function destroy(int $id)
    {
        $this->cashRegisterService->delete($id);
        return $this->deletedResponse('Caja eliminada con éxito.');
    }

    public function movements(int $id)
    {
        $movements = $this->cashRegisterService->getMovements($id);
        return $this->successResponse($movements, 'Movimientos de caja obtenidos con éxito.');
    }

    public function registerMovement(Request $request, int $id)
    {
        $data = $request->validate([
            'type'        => ['required', Rule::in(['income', 'expense'])],
            'amount'      => ['required', 'numeric', 'min:0.01'],
            'description' => ['required', 'string', 'max:150'],
        ]);

        $movement = $this->cashRegisterService->registerMovement(
            $id,
            $data['type'],
            (float) $data['amount'],
            $data['description']
        );

        return $this->createdResponse($movement, 'Movimiento de caja registrado con éxito.');
    }

    public function close(Request $request, int $id)
    {
        $data = $request->validate([
            'closing_amount' => ['required', 'numeric', 'min:0'],
        ]);

        $closeResult = $this->cashRegisterService->close($id, (float) $data['closing_amount']);
        return $this->successResponse($closeResult, 'Caja cerrada con éxito.');
    }

    public function export(Request $request)
    {
        $format = (string) $request->query('format', 'excel');
        return $this->cashRegisterService->export($format);
    }
}
