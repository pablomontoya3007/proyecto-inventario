<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\FiltraPorUbicacion;
use App\Http\Requests\LicenciaOfficeRequest;
use App\Http\Resources\LicenciaOfficeResource;
use App\Models\LicenciaOffice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LicenciaOfficeController extends Controller
{
    use FiltraPorUbicacion;

    /**
     * Filtros disponibles: sede_id/subsede_id/ubicacion_formacion_id
     * (ubicación del equipo dueño), placa_sena (equipo), correo, estado
     * (activa/vencida/suspendida) y fecha_desde/fecha_hasta (rango sobre
     * fecha_actualizacion). Todos opcionales y combinables.
     *
     * Ubicación y placa comparten un solo whereHas('equipo', ...): ambos
     * dependen del equipo dueño de la licencia, así que se resuelven en
     * una sola subconsulta en vez de dos. Ese whereHas solo se agrega si
     * alguno de los dos está activo — igual que antes, para no excluir
     * del listado general las licencias cuyo equipo ya fue eliminado
     * (soft delete) cuando no hay razón para mirar el equipo.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', LicenciaOffice::class);

        [$sedeId, $subsedeId, $ubicacionId] = $this->filtrosUbicacion($request);

        $licencias = LicenciaOffice::query()
            ->with('equipo.ubicacionFormacion.subsede.sede')
            ->when(
                $request->filled('correo'),
                fn ($q) => $q->where('correo', 'like', '%' . $request->input('correo') . '%')
            )
            ->when(
                $request->filled('estado'),
                fn ($q) => $q->where('estado_licencia', $request->input('estado'))
            )
            ->when(
                $request->filled('fecha_desde'),
                fn ($q) => $q->whereDate('fecha_actualizacion', '>=', $request->input('fecha_desde'))
            )
            ->when(
                $request->filled('fecha_hasta'),
                fn ($q) => $q->whereDate('fecha_actualizacion', '<=', $request->input('fecha_hasta'))
            )
            ->when(
                $sedeId || $subsedeId || $ubicacionId || $request->filled('placa_sena'),
                fn ($q) => $q->whereHas('equipo', function ($sub) use ($sedeId, $subsedeId, $ubicacionId, $request) {
                    $sub->filtrarPorUbicacion($sedeId, $subsedeId, $ubicacionId)
                        ->when(
                            $request->filled('placa_sena'),
                            fn ($s) => $s->where('placa_sena', 'like', '%' . $request->input('placa_sena') . '%')
                        );
                })
            )
            ->latest()
            ->paginate(15);

        return LicenciaOfficeResource::collection($licencias);
    }

    public function store(LicenciaOfficeRequest $request): JsonResponse
    {
        $this->authorize('create', LicenciaOffice::class);

        $datos = $request->validated();
        $datos['password_cifrado'] = $datos['password'];
        unset($datos['password']);

        $licencia = LicenciaOffice::create($datos);

        return (new LicenciaOfficeResource($licencia))->response()->setStatusCode(201);
    }

    public function mostrarPassword(LicenciaOffice $licenciaOffice): JsonResponse
    {
        $this->authorize('view', $licenciaOffice);

        return response()->json(['password' => $licenciaOffice->password_cifrado]);
    }

    public function show(LicenciaOffice $licenciaOffice): LicenciaOfficeResource
    {
        $this->authorize('view', $licenciaOffice);

        return new LicenciaOfficeResource($licenciaOffice->load('equipo'));
    }

    public function update(LicenciaOfficeRequest $request, LicenciaOffice $licenciaOffice): LicenciaOfficeResource
    {
        $this->authorize('update', $licenciaOffice);

        $datos = $request->validated();

        if (array_key_exists('password', $datos)) {
            $datos['password_cifrado'] = $datos['password'];
            unset($datos['password']);
        }

        $licenciaOffice->update($datos);

        return new LicenciaOfficeResource($licenciaOffice);
    }

    public function destroy(LicenciaOffice $licenciaOffice): JsonResponse
    {
        $this->authorize('delete', $licenciaOffice);

        $licenciaOffice->delete();

        return response()->json(['mensaje' => 'Licencia eliminada correctamente.']);
    }
}