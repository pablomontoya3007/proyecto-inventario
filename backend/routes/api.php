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
use App\Http\Controllers\MantenimientoController;
use App\Http\Controllers\TrasladoController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'usuarioActual']);

    Route::apiResource('sedes', SedeController::class);
    Route::apiResource('subsedes', SubsedeController::class);
    

    // ->parameters(...): sin esto, Laravel intentaría adivinar el nombre
    // del parámetro pluralizando en inglés "ubicaciones-formacion", igual
    // que nos pasó con las tablas. Se fija explícito para que coincida con
    // lo que ya asumieron los Form Requests (->ignore($this->route(...))).
    Route::apiResource('ubicaciones-formacion', UbicacionFormacionController::class)
        ->parameters(['ubicaciones-formacion' => 'ubicacion_formacion']);

    Route::apiResource('tipos-equipo', TipoEquipoController::class)
        ->parameters(['tipos-equipo' => 'tipo_equipo']);

    Route::apiResource('responsables', ResponsableController::class);
    Route::apiResource('equipos', EquipoController::class);
    Route::get('equipos/{equipo}/hoja-de-vida/pdf', [EquipoController::class, 'hojaDeVidaPdf']);

    Route::apiResource('licencias-office', LicenciaOfficeController::class)
        ->parameters(['licencias-office' => 'licencia_office']);

    // Sin update ni destroy: las observaciones son inmutables.
    Route::apiResource('observaciones', ObservacionController::class)
        ->only(['index', 'store', 'show']);
            
    Route::apiResource('mantenimientos', MantenimientoController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    // Sin update ni destroy: los traslados son inmutables, igual que las
    // observaciones — un error de captura se corrige con uno nuevo.
    Route::apiResource('traslados', TrasladoController::class)
        ->only(['index', 'store']);


    // Fase 5 — RF-08 Reportes y Consultas. La parte de "Consultas" ya
    // está cubierta por los filtros de EquipoController::index(); esto
    // cubre la parte de "Reportes" (vistas agregadas).
    Route::prefix('reportes')->group(function () {
        Route::get('equipos', [ReporteController::class, 'equipos']);
        Route::get('equipos/excel', [ReporteController::class, 'equiposExcel']);
        Route::get('equipos/pdf', [ReporteController::class, 'equiposPdf']);

        Route::get('licencias', [ReporteController::class, 'licencias']);
        Route::get('licencias/excel', [ReporteController::class, 'licenciasExcel']);
        Route::get('licencias/pdf', [ReporteController::class, 'licenciasPdf']);

        Route::get('responsables', [ReporteController::class, 'responsables']);
        Route::get('responsables/excel', [ReporteController::class, 'responsablesExcel']);
        Route::get('responsables/pdf', [ReporteController::class, 'responsablesPdf']);
    });
});