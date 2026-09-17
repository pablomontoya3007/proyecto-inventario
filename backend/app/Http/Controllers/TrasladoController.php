<?php

namespace App\Http\Controllers;

use App\Http\Requests\TrasladoRequest;
use App\Http\Resources\TrasladoResource;
use App\Models\Equipo;
use App\Models\Traslado;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class TrasladoController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Traslado::class);

        $traslados = Traslado::query()
            ->with(['equipo', 'ubicacionOrigen.subsede.sede', 'ubicacionDestino.subsede.sede'])
            ->when($request->filled('equipo_id'), fn ($q) => $q->where('equipo_id', $request->input('equipo_id')))
            ->latest('fecha_traslado')
            ->paginate(15);

        return TrasladoResource::collection($traslados);
    }

    /**
     * ubicacion_origen_id se captura aquí, de la ubicación actual del
     * equipo — nunca la escoge el cliente. El traslado y el cambio de
     * ubicación en Equipo pasan juntos en una transacción: si uno
     * fallara, no debe quedar un traslado "fantasma" sin que el equipo
     * se haya movido de verdad.
     */
    public function store(TrasladoRequest $request): JsonResponse
    {
        $this->authorize('create', Traslado::class);

        $equipo = Equipo::findOrFail($request->validated('equipo_id'));

        $traslado = DB::transaction(function () use ($request, $equipo) {
            $traslado = Traslado::create([
                ...$request->validated(),
                'ubicacion_origen_id' => $equipo->ubicacion_formacion_id,
            ]);

            $equipo->update(['ubicacion_formacion_id' => $request->validated('ubicacion_destino_id')]);

            return $traslado;
        });

        $traslado->load(['equipo', 'ubicacionOrigen.subsede.sede', 'ubicacionDestino.subsede.sede']);

        return (new TrasladoResource($traslado))->response()->setStatusCode(201);
    }
}