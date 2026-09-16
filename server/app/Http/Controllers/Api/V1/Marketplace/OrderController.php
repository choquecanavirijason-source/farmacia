<?php

namespace App\Http\Controllers\Api\V1\Marketplace;

use App\Http\Requests\Marketplace\StoreOrderRequest;
use App\Http\Requests\PaginationRequest;
use App\Http\Resources\Marketplace\OrderResource;
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
        $filters = $request->getFilters(['status']);

        $result = $this->orderService->getPaginatedForUser(
            $request->user(),
            $filters,
            $request->getPerPage(10),
            $request->getSortBy('created_at'),
            $request->getSortDir('desc')
        );

        return $this->collectionResponse(OrderResource::collection($result), 'Pedidos obtenidos con éxito.');
    }

    public function show(Request $request, int $id)
    {
        $order = $this->orderService->getByIdForUser($request->user(), $id);

        return $this->resourceResponse(new OrderResource($order), 'Pedido obtenido con éxito.');
    }

    public function store(StoreOrderRequest $request)
    {
        $order = $this->orderService->create($request->user(), $request->validated());

        return $this->createdResponse(new OrderResource($order), 'Pedido creado con éxito.');
    }
}
