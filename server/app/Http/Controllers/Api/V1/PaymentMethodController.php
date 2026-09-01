<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\PaginationRequest;
use App\Http\Requests\PaymentMethods\StorePaymentMethodRequest;
use App\Http\Requests\PaymentMethods\UpdatePaymentMethodRequest;
use App\Http\Resources\PaymentMethods\PaymentMethodResource;
use App\Models\PaymentMethod;
use App\Services\PaymentMethodService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class PaymentMethodController
{
    use ApiResponseTrait;

    public function __construct(
        protected PaymentMethodService $paymentMethodService
    ) {}

    public function index(PaginationRequest $request)
    {
        $filters = $request->getFilters(['search', 'status']);

        $result = $this->paymentMethodService->getPaginated(
            $filters,
            $request->getPerPage(10),
            $request->getSortBy('name'),
            $request->getSortDir('asc')
        );

        return $this->collectionResponse(PaymentMethodResource::collection($result), 'Métodos de pago obtenidos con éxito.');
    }

    public function store(StorePaymentMethodRequest $request)
    {
        $method = $this->paymentMethodService->create($request->validated());
        return $this->createdResponse(new PaymentMethodResource($method), 'Método de pago registrado con éxito.');
    }

    public function show(int $id)
    {
        $method = PaymentMethod::findOrFail($id);
        return $this->resourceResponse(new PaymentMethodResource($method), 'Método de pago obtenido con éxito.');
    }

    public function update(UpdatePaymentMethodRequest $request, int $id)
    {
        $method = PaymentMethod::findOrFail($id);
        $updatedMethod = $this->paymentMethodService->update($method, $request->validated());
        return $this->updatedResponse(new PaymentMethodResource($updatedMethod), 'Método de pago actualizado con éxito.');
    }

    public function destroy(int $id)
    {
        $this->paymentMethodService->delete($id);
        return $this->deletedResponse('Método de pago eliminado con éxito.');
    }

    public function export(Request $request)
    {
        $format = (string) $request->query('format', 'excel');
        return $this->paymentMethodService->export($format);
    }
}
