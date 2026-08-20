<?php

namespace App\Http\Controllers;

use App\Http\Requests\LicenciaOfficeRequest;
use App\Http\Resources\LicenciaOfficeResource;
use App\Models\LicenciaOffice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LicenciaOfficeController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', LicenciaOffice::class);

        return LicenciaOfficeResource::collection(
            LicenciaOffice::with('equipo')->latest()->paginate(15)
        );
    }

    /**
     * LicenciaOfficeRequest valida "password" (lo que escribe quien llena
     * el formulario). Aquí se traduce a "password_cifrado", el nombre real
     * de la columna — el cast 'encrypted' del modelo cifra el valor en
     * cuanto se le asigna, sin que este Controller tenga que saber nada de
     * cifrado.
     */
    public function store(LicenciaOfficeRequest $request): JsonResponse
    {
        $this->authorize('create', LicenciaOffice::class);

        $datos = $request->validated();
        $datos['password_cifrado'] = $datos['password'];
        unset($datos['password']);

        $licencia = LicenciaOffice::create($datos);

        return (new LicenciaOfficeResource($licencia))->response()->setStatusCode(201);
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

        // La contraseña es opcional al editar (ver LicenciaOfficeRequest):
        // si no vino en esta petición, se conserva la que ya existe.
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
