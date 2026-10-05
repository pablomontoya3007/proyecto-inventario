<?php

namespace App\Http\Controllers;

use App\Enums\EstadoNovedad;
use App\Http\Controllers\Concerns\FiltraPorUbicacion;
use App\Http\Requests\NovedadRequest;
use App\Http\Resources\NovedadResource;
use App\Models\Novedad;
use App\Services\EnvioCorreoService;
use App\Support\PlantillasCorreo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

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
     * Filtros (opcionales y combinables): placa_sena y sede_id/
     * subsede_id/ubicacion_formacion_id (sobre el equipo, en un solo
     * whereHas), estado, usuario (nombre de quien la reportó),
     * asignado_a (usuario encargado de revisarla) y fecha_desde/fecha_hasta.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Novedad::class);

        [$sedeId, $subsedeId, $ubicacionId] = $this->filtrosUbicacion($request);

        $novedades = Novedad::query()
            ->with(self::RELACIONES)
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
            ->when($request->filled('estado'), fn ($q) => $q->where('estado', $request->input('estado')))
            ->when(
                $request->filled('usuario'),
                fn ($q) => $q->whereHas('usuario', fn ($s) => $s->where('name', 'like', '%' . $request->input('usuario') . '%'))
            )
            ->when($request->filled('asignado_a'), fn ($q) => $q->where('asignado_a', $request->integer('asignado_a')))
            ->when($request->filled('fecha_desde'), fn ($q) => $q->whereDate('created_at', '>=', $request->input('fecha_desde')))
            ->when($request->filled('fecha_hasta'), fn ($q) => $q->whereDate('created_at', '<=', $request->input('fecha_hasta')))
            ->latest()
            ->paginate(15);

        return NovedadResource::collection($novedades);
    }

    /**
     * Registra la novedad y envía hasta DOS correos (textos distintos):
     * - al responsable del equipo ("novedad en un equipo a tu cargo");
     * - al usuario asignado para revisarla ("se te asignó una novedad").
     * Si ambos tienen el mismo correo, se envía solo el de asignación.
     *
     * La novedad se guarda SIEMPRE; "notificaciones" explica qué se
     * envió y qué no (y por qué).
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
     * Marca la novedad como resuelta, con nota opcional. Quién y cuándo
     * los pone el servidor, nunca el cliente.
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