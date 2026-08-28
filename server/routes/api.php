<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BatchController;
use App\Http\Controllers\CashRegisterController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\InventoryMovementController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\LaboratoryController;
use App\Http\Controllers\MedicamentController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\PresentationController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('auth/login', [AuthController::class, 'login']);

Route::middleware('auth:api')->group(function () {
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me']);

    $resources = [
        'clients' => ClientController::class,
        'categories' => CategoryController::class,
        'presentations' => PresentationController::class,
        'laboratories' => LaboratoryController::class,
        'medicaments' => MedicamentController::class,
        'suppliers' => SupplierController::class,
        'batches' => BatchController::class,
        'cash-registers' => CashRegisterController::class,
        'inventory-movements' => InventoryMovementController::class,
        'invoices' => InvoiceController::class,
        'payment-methods' => PaymentMethodController::class,
        'purchases' => PurchaseController::class,
        'sales' => SaleController::class,
    ];

    foreach ($resources as $uri => $controller) {
        Route::get("{$uri}/export", [$controller, 'export']);
        Route::get($uri, [$controller, 'index']);
        Route::post($uri, [$controller, 'store']);
        Route::get("{$uri}/{id}", [$controller, 'show']);
        Route::put("{$uri}/{id}", [$controller, 'update']);
        Route::delete("{$uri}/{id}", [$controller, 'destroy']);
    }

    // Caja: apertura, movimientos, registro manual y cierre.
    Route::get('cash-registers/{id}/movements', [CashRegisterController::class, 'movements']);
    Route::post('cash-registers/{id}/movements', [CashRegisterController::class, 'registerMovement']);
    Route::post('cash-registers/{id}/close', [CashRegisterController::class, 'close']);

    // Ventas: detalle, factura y anulación (con restauración de stock).
    Route::get('sales/{id}/details', [SaleController::class, 'details']);
    Route::get('sales/{id}/invoice', [SaleController::class, 'invoice']);
    Route::post('sales/{id}/void', [SaleController::class, 'void']);

    // Lotes: kardex, venta, restauración y baja de stock.
    Route::get('batches/{id}/kardex', [BatchController::class, 'kardex']);
    Route::post('batches/{id}/sell', [BatchController::class, 'sell']);
    Route::post('batches/{id}/restore', [BatchController::class, 'restore']);
    Route::post('batches/{id}/dispose', [BatchController::class, 'dispose']);

    // Kardex por medicamento (todos sus lotes).
    Route::get('medicaments/{id}/kardex', [MedicamentController::class, 'kardex']);

    // Compras: líneas de la compra.
    Route::get('purchases/{id}/details', [PurchaseController::class, 'details']);

    Route::get('users/export', [UserController::class, 'export']);
    Route::get('users', [UserController::class, 'index']);
    Route::post('users', [UserController::class, 'store']);
    Route::get('users/{id}', [UserController::class, 'show']);
    Route::put('users/{id}', [UserController::class, 'update']);
    Route::delete('users/{id}', [UserController::class, 'destroy']);

    Route::get('companies/export', [CompanyController::class, 'export']);
    Route::get('companies', [CompanyController::class, 'index']);
    Route::post('companies', [CompanyController::class, 'store']);
    Route::get('companies/{id}', [CompanyController::class, 'show']);
    Route::put('companies/{id}', [CompanyController::class, 'update']);
    Route::delete('companies/{id}', [CompanyController::class, 'destroy']);
});
