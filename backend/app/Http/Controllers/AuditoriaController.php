<?php

namespace App\Http\Controllers;

use App\Http\Resources\AuditoriaResource;
use App\Models\Auditoria;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Solo lectura: la auditoría se llena sola (AuditoriaObserver). Filtros
 * disponibles: entidad (nombre corto de la clase, ej. "Equipo"), accion
 * (creado/actualizado/eliminado), usuario (nombre, búsqueda parcial),
 * fecha_desde/fecha_hasta — todos opcionales y combinables.
 */
class AuditoriaController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Auditoria::class);

        $auditorias = Auditoria::query()
            ->with('usuario')
            ->when(
                $request->filled('entidad'),
                fn ($q) => $q->where('auditable_type', 'App\\Models\\'.$request->input('entidad'))
            )
            ->when($request->filled('accion'), fn ($q) => $q->where('accion', $request->input('accion')))
            ->when(
                $request->filled('usuario'),
                fn ($q) => $q->whereHas('usuario', fn ($s) => $s->where('name', 'like', '%'.$request->input('usuario').'%'))
            )
            ->when(
                $request->filled('fecha_desde'),
                fn ($q) => $q->whereDate('created_at', '>=', $request->input('fecha_desde'))
            )
            ->when(
                $request->filled('fecha_hasta'),
                fn ($q) => $q->whereDate('created_at', '<=', $request->input('fecha_hasta'))
            )
            ->latest()
            ->paginate(20);

        return AuditoriaResource::collection($auditorias);
    }
}
