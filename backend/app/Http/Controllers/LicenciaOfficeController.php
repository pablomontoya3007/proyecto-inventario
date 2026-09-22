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

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', LicenciaOffice::class);

        [$sedeId, $subsedeId, $ubicacionId] = $this->filtrosUbicacion($request);

        $licencias = LicenciaOffice::query()
            ->with('equipo.ubicacionFormacion.subsede.sede')
            ->when(
                $sedeId || $subsedeId || $ubicacionId,
                fn ($q) => $q->whereHas(
                    'equipo',
                    fn ($sub) => $sub->filtrarPorUbicacion($sedeId, $subsedeId, $ubicacionId)
                )
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