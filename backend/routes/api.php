<?php

use App\Http\Controllers\AuditoriaController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EquipoController;
use App\Http\Controllers\LicenciaOfficeController;
use App\Http\Controllers\MantenimientoController;
use App\Http\Controllers\MantenimientoMasivoController;
use App\Http\Controllers\NotificacionController;
use App\Http\Controllers\ObservacionController;
use App\Http\Controllers\ReporteController;
use App\Http\Controllers\RespaldoController;
use App\Http\Controllers\ResponsableController;
use App\Http\Controllers\SedeController;
use App\Http\Controllers\SubsedeController;
use App\Http\Controllers\TipoEquipoController;
use App\Http\Controllers\TrasladoController;
use App\Http\Controllers\UbicacionFormacionController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'usuarioActual']);
    Route::get('/dashboard', [DashboardController::class, 'resumen']);
    Route::get('/auditorias', [AuditoriaController::class, 'index']);
    Route::get('/notificaciones/licencias', [NotificacionController::class, 'licenciasSinActualizar']);

    Route::apiResource('sedes', SedeController::class);
    Route::apiResource('subsedes', SubsedeController::class);

    Route::apiResource('ubicaciones-formacion', UbicacionFormacionController::class)
        ->parameters(['ubicaciones-formacion' => 'ubicacion_formacion']);

    Route::apiResource('tipos-equipo', TipoEquipoController::class)
        ->parameters(['tipos-equipo' => 'tipo_equipo']);

    Route::apiResource('responsables', ResponsableController::class);

    // Estas dos van ANTES del apiResource de equipos: si van después,
    // GET equipos/{equipo} captura "plantilla-importacion" como si fuera
    // un id de equipo y responde 404.
    Route::post('equipos/importar', [EquipoController::class, 'importar']);
    Route::get('equipos/plantilla-importacion', [EquipoController::class, 'plantillaImportacion']);

    Route::apiResource('equipos', EquipoController::class);
    Route::get('equipos/{equipo}/hoja-de-vida/pdf', [EquipoController::class, 'hojaDeVidaPdf']);

    // Mismo motivo que en equipos: ANTES del apiResource.
    Route::post('licencias-office/importar', [LicenciaOfficeController::class, 'importar']);
    Route::get('licencias-office/plantilla-importacion', [LicenciaOfficeController::class, 'plantillaImportacion']);

    Route::apiResource('licencias-office', LicenciaOfficeController::class)
        ->parameters(['licencias-office' => 'licencia_office']);
    Route::get('licencias-office/{licencia_office}/password', [LicenciaOfficeController::class, 'mostrarPassword']);

    Route::apiResource('observaciones', ObservacionController::class)
        ->only(['index', 'store', 'show']);

    // Mantenimiento masivo — ANTES del apiResource, por la misma razón
    // que en equipos (que "masivo" nunca se confunda con un id).
    Route::get('mantenimientos/masivo/equipos', [MantenimientoMasivoController::class, 'equipos']);
    Route::post('mantenimientos/masivo', [MantenimientoMasivoController::class, 'store']);

    Route::apiResource('mantenimientos', MantenimientoController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    Route::apiResource('traslados', TrasladoController::class)
        ->only(['index', 'store']);

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

    Route::prefix('respaldos')->group(function () {
        Route::get('generar', [RespaldoController::class, 'generar']);
        Route::post('restaurar', [RespaldoController::class, 'restaurar']);
    });
});