<?php

namespace App\Http\Controllers;

use App\Exports\TablaExport;
use App\Http\Controllers\Concerns\FiltraPorUbicacion;
use App\Http\Requests\TrasladoRequest;
use App\Http\Resources\TrasladoResource;
use App\Models\Equipo;
use App\Models\Traslado;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

class TrasladoController extends Controller
{
    use FiltraPorUbicacion;

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Traslado::class);

        $traslados = $this->consultaFiltrada($request)
            ->with(['equipo', 'ubicacionOrigen.subsede.sede', 'ubicacionDestino.subsede.sede'])
            ->paginate(15);

        return TrasladoResource::collection($traslados);
    }

    /**
     * Excel con todos los traslados que cumplen los filtros de la pantalla.
     */
    public function exportar(Request $request)
    {
        $this->authorize('viewAny', Traslado::class);

        $filas = $this->consultaFiltrada($request)
            ->with(['equipo', 'ubicacionOrigen.subsede.sede', 'ubicacionDestino.subsede.sede'])
            ->get()
            ->map(fn (Traslado $traslado) => [
                $traslado->fecha_traslado?->format('d/m/Y') ?? '—',
                $traslado->equipo?->placa_sena ?? 'Equipo eliminado',
                self::rutaUbicacion($traslado->ubicacionOrigen),
                self::rutaUbicacion($traslado->ubicacionDestino),
                $traslado->motivo ?? '—',
            ])
            ->all();

        return Excel::download(
            new TablaExport(['Fecha', 'Placa SENA', 'Origen', 'Destino', 'Motivo'], $filas),
            'traslados.xlsx'
        );
    }

    /**
     * Consulta con todos los filtros, compartida por index() y exportar().
     */
    private function consultaFiltrada(Request $request): Builder
    {
        [$sedeId, $subsedeId, $ubicacionId] = $this->filtrosUbicacion($request);

        return Traslado::query()
            ->when($request->filled('equipo_id'), fn ($q) => $q->where('equipo_id', $request->input('equipo_id')))
            ->filtrarPorUbicacion($sedeId, $subsedeId, $ubicacionId)
            ->latest('fecha_traslado');
    }

    private static function rutaUbicacion($ubicacion): string
    {
        if (!$ubicacion) {
            return '—';
        }

        return implode(' / ', array_filter([
            $ubicacion->subsede?->sede?->nombre,
            $ubicacion->subsede?->nombre,
            $ubicacion->nombre,
        ]));
    }

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