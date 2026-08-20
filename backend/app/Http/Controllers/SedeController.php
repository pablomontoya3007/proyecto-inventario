<?php

namespace App\Http\Controllers;

use App\Http\Requests\SedeRequest;
use App\Http\Resources\SedeResource;
use App\Models\Sede;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SedeController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Sede::class);

        return SedeResource::collection(Sede::orderBy('nombre')->paginate(15));
    }

    public function store(SedeRequest $request): JsonResponse
    {
        $this->authorize('create', Sede::class);

        $sede = Sede::create($request->validated());

        return (new SedeResource($sede))->response()->setStatusCode(201);
    }

    public function show(Sede $sede): SedeResource
    {
        $this->authorize('view', $sede);

        return new SedeResource($sede->load('subsedes'));
    }

    public function update(SedeRequest $request, Sede $sede): SedeResource
    {
        $this->authorize('update', $sede);

        $sede->update($request->validated());

        return new SedeResource($sede);
    }

    public function destroy(Sede $sede): JsonResponse
    {
        $this->authorize('delete', $sede);

        $sede->delete();

        return response()->json(['mensaje' => 'Sede eliminada correctamente.']);
    }
}
