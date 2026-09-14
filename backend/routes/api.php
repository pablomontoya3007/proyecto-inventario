<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EquipoController;
use App\Http\Controllers\LicenciaOfficeController;
use App\Http\Controllers\ObservacionController;
use App\Http\Controllers\ReporteController;
use App\Http\Controllers\ResponsableController;
use App\Http\Controllers\SedeController;
use App\Http\Controllers\SubsedeController;
use App\Http\Controllers\TipoEquipoController;
use App\Http\Controllers\UbicacionFormacionController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'usuarioActual']);

    Route::apiResource('sedes', SedeController::class);
    Route::apiResource('subsedes', SubsedeController::class);

    Route::apiResource('ubicaciones-formacion', UbicacionFormacionController::class)
        ->parameters(['ubicaciones-formacion' => 'ubicacion_formacion']);

    Route::apiResource('tipos-equipo', TipoEquipoController::class)
        ->parameters(['tipos-equipo' => 'tipo_equipo']);

    Route::apiResource('responsables', ResponsableController::class);
    Route::apiResource('equipos', EquipoController::class);

    Route::apiResource('licencias-office', LicenciaOfficeController::class)
        ->parameters(['licencias-office' => 'licencia_office']);

    Route::apiResource('observaciones', ObservacionController::class)
        ->only(['index', 'store', 'show']);

    // Fase 5 — RF-08 Reportes y Consultas. La parte de "Consultas" ya
    // está cubierta por los filtros de EquipoController::index(); esto
    // cubre la parte de "Reportes" (vistas agregadas).
    Route::prefix('reportes')->group(function () {
        Route::get('equipos', [ReporteController::class, 'equipos']);
        Route::get('equipos/excel', [ReporteController::class, 'equiposExcel']);
        Route::get('equipos/pdf', [ReporteController::class, 'equiposPdf']);
    });
});