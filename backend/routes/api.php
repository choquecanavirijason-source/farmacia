<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CajaController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\CompraController;
use App\Http\Controllers\EmpresaController;
use App\Http\Controllers\LaboratorioController;
use App\Http\Controllers\LoteController;
use App\Http\Controllers\MedicamentoController;
use App\Http\Controllers\PresentacionController;
use App\Http\Controllers\ProveedorController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\VentaController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::get('/roles', [RoleController::class, 'index']);

    // Lectura: ambos roles (Ventas/POS necesita catálogo y precios de medicamentos).
    Route::get('/categorias', [CategoriaController::class, 'index']);
    Route::get('/presentaciones', [PresentacionController::class, 'index']);
    Route::get('/laboratorios', [LaboratorioController::class, 'index']);
    Route::get('/medicamentos', [MedicamentoController::class, 'index']);
    Route::get('/lotes', [LoteController::class, 'index']);

    // Movimiento de stock por venta: lo dispara VENDEDOR desde el POS.
    Route::post('/lotes/{lote}/vender', [LoteController::class, 'vender']);
    Route::post('/lotes/{lote}/restaurar', [LoteController::class, 'restaurar']);

    // Clientes, Caja y Ventas: ambos roles operan el POS.
    Route::get('/clientes/exportar', [ClienteController::class, 'exportar']);
    Route::delete('/clientes', [ClienteController::class, 'bulkDestroy']);
    Route::apiResource('clientes', ClienteController::class);

    Route::get('/cajas', [CajaController::class, 'index']);
    Route::get('/cajas/abierta', [CajaController::class, 'abierta']);
    Route::post('/cajas', [CajaController::class, 'store']);
    Route::get('/cajas/{caja}/movimientos', [CajaController::class, 'movimientos']);
    Route::post('/cajas/{caja}/movimientos', [CajaController::class, 'registrarMovimiento']);
    Route::post('/cajas/{caja}/cerrar', [CajaController::class, 'cerrar']);

    Route::get('/ventas', [VentaController::class, 'index']);
    Route::post('/ventas', [VentaController::class, 'store']);
    Route::get('/ventas/{venta}/detalles', [VentaController::class, 'detalles']);
    Route::get('/ventas/{venta}/factura', [VentaController::class, 'factura']);
    Route::post('/ventas/{venta}/anular', [VentaController::class, 'anular']);

    Route::middleware('role:ADMINISTRADOR')->group(function () {
        Route::get('/usuarios', [UsuarioController::class, 'index']);
        Route::post('/usuarios', [UsuarioController::class, 'store']);
        Route::put('/usuarios/{usuario}', [UsuarioController::class, 'update']);
        Route::delete('/usuarios/{usuario}', [UsuarioController::class, 'destroy']);

        Route::post('/categorias', [CategoriaController::class, 'store']);
        Route::put('/categorias/{categoria}', [CategoriaController::class, 'update']);
        Route::delete('/categorias/{categoria}', [CategoriaController::class, 'destroy']);

        Route::post('/presentaciones', [PresentacionController::class, 'store']);
        Route::put('/presentaciones/{presentacion}', [PresentacionController::class, 'update']);
        Route::delete('/presentaciones/{presentacion}', [PresentacionController::class, 'destroy']);

        Route::post('/laboratorios', [LaboratorioController::class, 'store']);
        Route::put('/laboratorios/{laboratorio}', [LaboratorioController::class, 'update']);
        Route::delete('/laboratorios/{laboratorio}', [LaboratorioController::class, 'destroy']);

        Route::post('/medicamentos', [MedicamentoController::class, 'store']);
        Route::put('/medicamentos/{medicamento}', [MedicamentoController::class, 'update']);
        Route::delete('/medicamentos/{medicamento}', [MedicamentoController::class, 'destroy']);

        Route::post('/lotes', [LoteController::class, 'store']);
        Route::put('/lotes/{lote}', [LoteController::class, 'update']);
        Route::delete('/lotes/{lote}', [LoteController::class, 'destroy']);
        Route::post('/lotes/{lote}/dar-de-baja', [LoteController::class, 'darDeBaja']);
        Route::get('/lotes/{lote}/kardex', [LoteController::class, 'kardex']);
        Route::get('/medicamentos/{medicamento}/kardex', [LoteController::class, 'kardexPorMedicamento']);

        Route::get('/proveedores', [ProveedorController::class, 'index']);
        Route::post('/proveedores', [ProveedorController::class, 'store']);
        Route::put('/proveedores/{proveedor}', [ProveedorController::class, 'update']);
        Route::delete('/proveedores/{proveedor}', [ProveedorController::class, 'destroy']);

        Route::get('/compras', [CompraController::class, 'index']);
        Route::post('/compras', [CompraController::class, 'store']);
        Route::get('/compras/{compra}/detalles', [CompraController::class, 'detalles']);

        Route::get('/empresa', [EmpresaController::class, 'show']);
        Route::put('/empresa', [EmpresaController::class, 'update']);
    });
});
