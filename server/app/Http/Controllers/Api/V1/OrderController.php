<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Orders\UpdateOrderStatusRequest;
use App\Http\Requests\PaginationRequest;
use App\Http\Resources\Orders\OrderResource;
use App\Models\Order;
use App\Services\Marketplace\OrderService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class OrderController
{
    use ApiResponseTrait;

    public function __construct(
        protected OrderService $orderService
    ) {}

    public function index(PaginationRequest $request)
    {
        $filters = $request->getFilters(['status', 'branch_id']);

        $result = $this->orderService->getPaginated(
            $filters,
            $request->getPerPage(10),
            $request->getSortBy('created_at'),
            $request->getSortDir('desc')
        );

        return $this->collectionResponse(OrderResource::collection($result), 'Pedidos obtenidos con éxito.');
    }

    public function show(int $id)
    {
        $order = $this->orderService->getById($id);

        return $this->resourceResponse(new OrderResource($order), 'Pedido obtenido con éxito.');
    }

    public function updateStatus(UpdateOrderStatusRequest $request, int $id)
    {
        $order = Order::with('details.medicament')->findOrFail($id);

        $updated = $this->orderService->updateStatus(
            $order,
            $request->validated('status'),
            $request->validated('branch_id'),
            $request->user()
        );

        return $this->resourceResponse(new OrderResource($updated), 'Estado del pedido actualizado con éxito.');
    }
}
