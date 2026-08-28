<?php

namespace App\Http\Controllers;

use App\Exports\RecordsExport;
use App\Http\Requests\PaymentMethods\StorePaymentMethodRequest;
use App\Http\Requests\PaymentMethods\UpdatePaymentMethodRequest;
use App\Http\Resources\PaymentMethods\PaymentMethodResource;
use App\Models\PaymentMethod;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class PaymentMethodController extends Controller
{
    public function index(Request $request)
    {
        return PaymentMethodResource::collection(PaymentMethod::query()->when($request->filled('search'), fn ($query) => $query->search((string) $request->query('search')))->filter($request->only(['status']))->sort((string) $request->query('sort_by', 'name'), (string) $request->query('sort_dir', 'asc'))->paginate(max(1, $request->integer('per_page', 10))));
    }

    public function store(StorePaymentMethodRequest $request)
    {
        return (new PaymentMethodResource(PaymentMethod::create($request->validated())))->response()->setStatusCode(201);
    }

    public function show(int $id)
    {
        return new PaymentMethodResource(PaymentMethod::findOrFail($id));
    }

    public function update(UpdatePaymentMethodRequest $request, int $id)
    {
        $item = PaymentMethod::findOrFail($id);
        $item->update($request->validated());

        return new PaymentMethodResource($item->refresh());
    }

    public function destroy(int $id)
    {
        PaymentMethod::findOrFail($id)->delete();

        return response()->json(['message' => 'Payment method deleted.']);
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
