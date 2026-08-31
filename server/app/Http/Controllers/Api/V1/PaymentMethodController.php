<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\RecordsExport;
use App\Http\Requests\PaymentMethods\StorePaymentMethodRequest;
use App\Http\Requests\PaymentMethods\UpdatePaymentMethodRequest;
use App\Http\Resources\PaymentMethods\PaymentMethodResource;
use App\Models\PaymentMethod;
use App\Traits\ApiResponseTrait;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class PaymentMethodController
{
    use ApiResponseTrait;

    public function index(Request $request)
    {
        $methods = PaymentMethod::query()->when($request->filled('search'), fn ($query) => $query->search((string) $request->query('search')))->filter($request->only(['status']))->sort((string) $request->query('sort_by', 'name'), (string) $request->query('sort_dir', 'asc'))->paginate(max(1, $request->integer('per_page', 10)));

        return $this->collectionResponse(PaymentMethodResource::collection($methods), 'Métodos de pago obtenidos con éxito.');
    }

    public function store(StorePaymentMethodRequest $request)
    {
        $method = PaymentMethod::create($request->validated());

        return $this->createdResponse(new PaymentMethodResource($method), 'Método de pago registrado con éxito.');
    }

    public function show(int $id)
    {
        return $this->resourceResponse(new PaymentMethodResource(PaymentMethod::findOrFail($id)), 'Método de pago obtenido con éxito.');
    }

    public function update(UpdatePaymentMethodRequest $request, int $id)
    {
        $item = PaymentMethod::findOrFail($id);
        $item->update($request->validated());

        return $this->updatedResponse(new PaymentMethodResource($item->refresh()), 'Método de pago actualizado con éxito.');
    }

    public function destroy(int $id)
    {
        PaymentMethod::findOrFail($id)->delete();

        return $this->deletedResponse('Método de pago eliminado con éxito.');
    }

    public function export(Request $request)
    {
        $items = PaymentMethod::orderBy('name')->get();
        $c = ['Name' => 'name', 'Status' => 'status'];
        if ($request->query('format') === 'pdf') {
            return Pdf::loadView('exports.records', ['title' => 'Payment methods', 'columns' => $c, 'records' => $items])->download('payment-methods.pdf');
        }

        return Excel::download(new RecordsExport($items, $c), 'payment-methods.xlsx');
    }
}
