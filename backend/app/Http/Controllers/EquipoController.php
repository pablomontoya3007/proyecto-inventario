<?php

namespace App\Http\Controllers;


use App\Http\Requests\EquipoRequest;
use App\Http\Resources\EquipoResource;
use App\Models\Equipo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Barryvdh\DomPDF\Facade\Pdf;

class EquipoController extends Controller
{
    /**
     * Cubre los criterios de búsqueda de la sección 7 de los requisitos:
     * placa, serial, mac, hostname, responsable, sede, subsede, ubicación,
     * tipo de equipo y estado — todos opcionales y combinables entre sí.
     * sede_id/subsede_id no son columnas de "equipos" (viven más arriba en
     * la jerarquía), así que se filtran con whereHas a través de la
     * relación en vez de un where directo.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Equipo::class);

        $equipos = Equipo::query()
            ->with(['tipoEquipo', 'responsable', 'ubicacionFormacion.subsede.sede'])
            ->when($request->filled('placa_sena'), fn ($q) => $q->where('placa_sena', 'like', '%' . $request->input('placa_sena') . '%'))
            ->when($request->filled('serial'), fn ($q) => $q->where('serial', 'like', '%' . $request->input('serial') . '%'))
            ->when($request->filled('mac'), fn ($q) => $q->where('mac', 'like', '%' . $request->input('mac') . '%'))
            ->when($request->filled('hostname'), fn ($q) => $q->where('hostname', 'like', '%' . $request->input('hostname') . '%'))
            ->when($request->filled('estado'), fn ($q) => $q->where('estado', $request->input('estado')))
            ->when($request->filled('tipo_equipo_id'), fn ($q) => $q->where('tipo_equipo_id', $request->input('tipo_equipo_id')))
            ->when($request->filled('responsable_id'), fn ($q) => $q->where('responsable_id', $request->input('responsable_id')))
            ->when($request->filled('ubicacion_formacion_id'), fn ($q) => $q->where('ubicacion_formacion_id', $request->input('ubicacion_formacion_id')))
            ->when($request->filled('subsede_id'), fn ($q) => $q->whereHas('ubicacionFormacion', fn ($sub) => $sub->where('subsede_id', $request->input('subsede_id'))))
            ->when($request->filled('sede_id'), fn ($q) => $q->whereHas('ubicacionFormacion.subsede', fn ($sub) => $sub->where('sede_id', $request->input('sede_id'))))
            ->latest()
            ->paginate(15);

        return EquipoResource::collection($equipos);
    }

    public function store(EquipoRequest $request): JsonResponse
    {
        $this->authorize('create', Equipo::class);

        $equipo = Equipo::create($request->validated());

        return (new EquipoResource($equipo))->response()->setStatusCode(201);
    }

    /**
     * La hoja de vida completa (sección 2 de los requisitos): a diferencia
     * de index(), aquí sí se precargan TODAS las relaciones, incluida la
     * licencia, el historial de observaciones con su usuario, y los
     * mantenimientos (programados y ya completados).
     */
    public function show(Equipo $equipo): EquipoResource
    {
        $this->authorize('view', $equipo);

        $equipo->load([
            'tipoEquipo',
            'responsable',
            'ubicacionFormacion.subsede.sede',
            'licenciaOffice',
            'observaciones.usuario',
            'mantenimientos',
            'traslados.ubicacionOrigen',
            'traslados.ubicacionDestino',
        ]);

        return new EquipoResource($equipo);
    }

    public function update(EquipoRequest $request, Equipo $equipo): EquipoResource
    {
        $this->authorize('update', $equipo);

        $equipo->update($request->validated());

        return new EquipoResource($equipo);
    }

    public function destroy(Equipo $equipo): JsonResponse
    {
        $this->authorize('delete', $equipo);

        $equipo->delete();

        return response()->json(['mensaje' => 'Equipo eliminado correctamente.']);
    }

    /**
     * Genera el PDF de la hoja de vida — mismas relaciones que show(),
     * pero renderizadas en una vista Blade en vez de JSON.
     */
    public function hojaDeVidaPdf(Equipo $equipo)
    {
        $this->authorize('view', $equipo);

        $equipo->load([
            'tipoEquipo',
            'responsable',
            'ubicacionFormacion.subsede.sede',
            'licenciaOffice',
            'observaciones.usuario',
            'mantenimientos',
            'traslados.ubicacionOrigen',
            'traslados.ubicacionDestino',
        ]);

        return Pdf::loadView('equipos.hoja-de-vida', ['equipo' => $equipo])
            ->download('hoja-de-vida-'.$equipo->placa_sena.'.pdf');
    }
}