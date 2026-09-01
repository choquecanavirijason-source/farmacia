<?php

use App\Http\Controllers\Api\V1\AuditController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\BatchController;
use App\Http\Controllers\Api\V1\CashRegisterController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\ClientController;
use App\Http\Controllers\Api\V1\CompanyController;
use App\Http\Controllers\Api\V1\InventoryMovementController;
use App\Http\Controllers\Api\V1\InvoiceController;
use App\Http\Controllers\Api\V1\LaboratoryController;
use App\Http\Controllers\Api\V1\MedicamentController;
use App\Http\Controllers\Api\V1\PaymentMethodController;
use App\Http\Controllers\Api\V1\PresentationController;
use App\Http\Controllers\Api\V1\PurchaseController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\SaleController;
use App\Http\Controllers\Api\V1\SupplierController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\DashboardController;
use Illuminate\Support\Facades\Route;

Route::post('auth/login', [AuthController::class, 'login']);

Route::middleware('auth:api')->group(function () {
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::put('auth/profile', [AuthController::class, 'updateProfile']);

    Route::get('dashboard/stats', [DashboardController::class, 'stats']);

    Route::get('categories/export', [CategoryController::class, 'export']);
    Route::delete('categories', [CategoryController::class, 'bulkDestroy']);
    Route::post('categories/{id}/restore', [CategoryController::class, 'restore']);
    Route::apiResource('categories', CategoryController::class);

    Route::get('presentations/export', [PresentationController::class, 'export']);
    Route::delete('presentations', [PresentationController::class, 'bulkDestroy']);
    Route::post('presentations/{id}/restore', [PresentationController::class, 'restore']);
    Route::apiResource('presentations', PresentationController::class);

    Route::get('laboratories/export', [LaboratoryController::class, 'export']);
    Route::delete('laboratories', [LaboratoryController::class, 'bulkDestroy']);
    Route::post('laboratories/{id}/restore', [LaboratoryController::class, 'restore']);
    Route::apiResource('laboratories', LaboratoryController::class);

    Route::get('medicaments/export', [MedicamentController::class, 'export']);
    Route::delete('medicaments', [MedicamentController::class, 'bulkDestroy']);
    Route::post('medicaments/{id}/restore', [MedicamentController::class, 'restore']);
    Route::get('medicaments/{id}/kardex', [MedicamentController::class, 'kardex']);
    Route::apiResource('medicaments', MedicamentController::class);

    Route::get('batches/export', [BatchController::class, 'export']);
    Route::delete('batches', [BatchController::class, 'bulkDestroy']);
    Route::get('batches/{id}/kardex', [BatchController::class, 'kardex']);
    Route::post('batches/{id}/sell', [BatchController::class, 'sell']);
    Route::post('batches/{id}/restore', [BatchController::class, 'restore']);
    Route::post('batches/{id}/dispose', [BatchController::class, 'dispose']);
    Route::apiResource('batches', BatchController::class);

    Route::get('inventory-movements/export', [InventoryMovementController::class, 'export']);
    Route::apiResource('inventory-movements', InventoryMovementController::class);

    Route::get('clients/export', [ClientController::class, 'export']);
    Route::delete('clients', [ClientController::class, 'bulkDestroy']);
    Route::post('clients/{id}/restore', [ClientController::class, 'restore']);
    Route::apiResource('clients', ClientController::class);

    Route::get('suppliers/export', [SupplierController::class, 'export']);
    Route::delete('suppliers', [SupplierController::class, 'bulkDestroy']);
    Route::post('suppliers/{id}/restore', [SupplierController::class, 'restore']);
    Route::apiResource('suppliers', SupplierController::class);

    Route::get('purchases/export', [PurchaseController::class, 'export']);
    Route::get('purchases/{id}/details', [PurchaseController::class, 'details']);
    Route::apiResource('purchases', PurchaseController::class);

    Route::get('sales/export', [SaleController::class, 'export']);
    Route::get('sales/{id}/details', [SaleController::class, 'details']);
    Route::get('sales/{id}/invoice', [SaleController::class, 'invoice']);
    Route::post('sales/{id}/void', [SaleController::class, 'void']);
    Route::apiResource('sales', SaleController::class);

    Route::get('invoices/export', [InvoiceController::class, 'export']);
    Route::apiResource('invoices', InvoiceController::class);

    Route::get('payment-methods/export', [PaymentMethodController::class, 'export']);
    Route::apiResource('payment-methods', PaymentMethodController::class);

    Route::get('cash-registers/export', [CashRegisterController::class, 'export']);
    Route::get('cash-registers/current', [CashRegisterController::class, 'current']);
    Route::post('cash-registers/open', [CashRegisterController::class, 'store']);
    Route::get('cash-registers/{id}/movements', [CashRegisterController::class, 'movements']);
    Route::post('cash-registers/{id}/movements', [CashRegisterController::class, 'registerMovement']);
    Route::post('cash-registers/{id}/close', [CashRegisterController::class, 'close']);
    Route::apiResource('cash-registers', CashRegisterController::class);

    Route::get('users/export', [UserController::class, 'export']);
    Route::delete('users', [UserController::class, 'bulkDestroy']);
    Route::post('users/{id}/restore', [UserController::class, 'restore']);
    Route::apiResource('users', UserController::class);

    Route::get('permissions', [RoleController::class, 'permissions']);
    Route::get('roles/export', [RoleController::class, 'export']);
    Route::delete('roles', [RoleController::class, 'bulkDestroy']);
    Route::apiResource('roles', RoleController::class);

    Route::get('company', [CompanyController::class, 'current']);
    Route::put('company', [CompanyController::class, 'updateCurrent']);
    Route::post('company', [CompanyController::class, 'updateCurrent']);
    Route::get('companies/export', [CompanyController::class, 'export']);
    Route::apiResource('companies', CompanyController::class);

    Route::get('audits/export', [AuditController::class, 'export']);
    Route::apiResource('audits', AuditController::class)->only(['index', 'show']);
});
