<?php

namespace App\Http\Controllers;

use App\Enums\EstadoNovedad;
use App\Exports\TablaExport;
use App\Http\Controllers\Concerns\FiltraPorUbicacion;
use App\Http\Requests\NovedadRequest;
use App\Http\Resources\NovedadResource;
use App\Models\Novedad;
use App\Services\EnvioCorreoService;
use App\Support\PlantillasCorreo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Maatwebsite\Excel\Facades\Excel;

class NovedadController extends Controller
{
    use FiltraPorUbicacion;

    private const RELACIONES = [
        'equipo.tipoEquipo',
        'equipo.responsable',
        'equipo.ubicacionFormacion.subsede.sede',
        'usuario',
        'asignado',
        'resueltaPor',
    ];

    /**
     * Filtros (opcionales y combinables): placa_sena y ubicación (sobre
     * el equipo, en un solo whereHas), estado, usuario (quien la
     * reportó), asignado_a, sin_asignar=1 y fecha_desde/fecha_hasta.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Novedad::class);

        $novedades = $this->consultaFiltrada($request)
            ->with(self::RELACIONES)
            ->paginate(15);

        return NovedadResource::collection($novedades)
            ->additional(['contadores' => $this->contadores($request)]);
    }

    /**
     * Contadores con los filtros de la pantalla, EXCEPTO estado y
     * sin_asignar: son justamente lo que esos contadores aplican al hacer
     * clic (si se respetaran, al elegir uno los demás quedarían en 0).
     */
    private function contadores(Request $request): array
    {
        $base = fn () => $this->consultaFiltrada($request, ['estado', 'sin_asignar'])->reorder();

        return [
            'sin_atender' => $base()->where('estado', EstadoNovedad::Abierta)->count(),
            'sin_asignar' => $base()->where('estado', EstadoNovedad::Abierta)->whereNull('asignado_a')->count(),
            'resueltas' => $base()->where('estado', EstadoNovedad::Resuelta)->count(),
        ];
    }

    /**
     * Excel con todas las novedades que cumplen los filtros de la pantalla.
     */
    public function exportar(Request $request)
    {
        $this->authorize('viewAny', Novedad::class);

        $filas = $this->consultaFiltrada($request)
            ->with(self::RELACIONES)
            ->get()
            ->map(fn (Novedad $novedad) => [
                $novedad->created_at?->format('d/m/Y H:i') ?? '—',
                $novedad->equipo?->placa_sena ?? 'Equipo eliminado',
                $novedad->equipo?->responsable?->nombre ?? 'Sin cuentadante',
                $novedad->descripcion,
                $novedad->usuario?->name ?? '—',
                $novedad->asignado?->name ?? 'Sin asignar',
                $novedad->estado?->label() ?? '—',
                $novedad->resuelta_en?->format('d/m/Y H:i') ?? '—',
                $novedad->resueltaPor?->name ?? '—',
                $novedad->nota_resolucion ?? '—',
            ])
            ->all();

        return Excel::download(
            new TablaExport(
                ['Fecha', 'Placa SENA', 'Cuentadante', 'Descripción', 'Reportada por', 'Asignada a', 'Estado', 'Resuelta el', 'Resuelta por', 'Nota de resolución'],
                $filas
            ),
            'novedades.xlsx'
        );
    }

    /**
     * Consulta con todos los filtros, compartida por index() y exportar().
     * $ignorar: filtros que no se aplican (los usan los contadores).
     */
    private function consultaFiltrada(Request $request, array $ignorar = []): Builder
    {
        [$sedeId, $subsedeId, $ubicacionId] = $this->filtrosUbicacion($request);

        return Novedad::query()
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
            ->when(
                $request->filled('estado') && !in_array('estado', $ignorar, true),
                fn ($q) => $q->where('estado', $request->input('estado'))
            )
            ->when(
                $request->filled('usuario'),
                fn ($q) => $q->whereHas('usuario', fn ($s) => $s->where('name', 'like', '%' . $request->input('usuario') . '%'))
            )
            ->when($request->filled('asignado_a'), fn ($q) => $q->where('asignado_a', $request->integer('asignado_a')))
            ->when(
                $request->boolean('sin_asignar') && !in_array('sin_asignar', $ignorar, true),
                fn ($q) => $q->whereNull('asignado_a')
            )
            ->when($request->filled('fecha_desde'), fn ($q) => $q->whereDate('created_at', '>=', $request->input('fecha_desde')))
            ->when($request->filled('fecha_hasta'), fn ($q) => $q->whereDate('created_at', '<=', $request->input('fecha_hasta')))
            ->latest();
    }

    /**
     * Registra la novedad y envía hasta DOS correos (textos distintos):
     * al responsable del equipo y al usuario asignado para revisarla.
     * Si ambos tienen el mismo correo, se envía solo el de asignación.
     */
    public function store(NovedadRequest $request, EnvioCorreoService $servicioCorreo): JsonResponse
    {
        $this->authorize('create', Novedad::class);

        $novedad = Novedad::create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
            'estado' => EstadoNovedad::Abierta,
        ])->load(self::RELACIONES);

        $remitente = $request->user();
        $responsable = $novedad->equipo?->responsable;
        $asignado = $novedad->asignado;
        $correoAsignado = $asignado ? mb_strtolower($asignado->email) : null;
        $notificaciones = [];

        if (!$responsable) {
            $notificaciones[] = $servicioCorreo->resumen(
                null,
                'El equipo no tiene responsable asignado: no se le envió correo a ningún responsable.'
            );
        } elseif (!$responsable->correo) {
            $notificaciones[] = $servicioCorreo->resumen(
                null,
                "El responsable {$responsable->nombre} no tiene correo registrado: no se le envió correo."
            );
        } elseif (mb_strtolower($responsable->correo) !== $correoAsignado) {
            [$asunto, $cuerpo] = PlantillasCorreo::novedadParaResponsable($novedad);
            $notificaciones[] = $servicioCorreo->resumen(
                $servicioCorreo->enviar($remitente, [$responsable->correo], $asunto, $cuerpo)
            );
        }

        if ($asignado) {
            [$asunto, $cuerpo] = PlantillasCorreo::novedadAsignada($novedad);
            $notificaciones[] = $servicioCorreo->resumen(
                $servicioCorreo->enviar($remitente, [$asignado->email], $asunto, $cuerpo)
            );
        }

        return (new NovedadResource($novedad))
            ->additional(['notificaciones' => $notificaciones])
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Marca la novedad como resuelta, con nota opcional.
     */
    public function resolver(Request $request, Novedad $novedad): NovedadResource
    {
        $this->authorize('update', $novedad);

        abort_if($novedad->estado === EstadoNovedad::Resuelta, 422, 'Esta novedad ya fue resuelta.');

        $datos = $request->validate(
            ['nota_resolucion' => ['nullable', 'string', 'max:2000']],
            ['nota_resolucion.max' => 'La nota no puede superar 2000 caracteres.']
        );

        $novedad->update([
            'estado' => EstadoNovedad::Resuelta,
            'nota_resolucion' => $datos['nota_resolucion'] ?? null,
            'resuelta_por' => $request->user()->id,
            'resuelta_en' => now(),
        ]);

        return new NovedadResource($novedad->load(self::RELACIONES));
    }
}