<?php

namespace App\Http\Controllers;

use App\Enums\EstadoEquipo;
use App\Http\Controllers\Concerns\FiltraPorUbicacion;
use App\Http\Resources\EquipoResource;
use App\Http\Resources\LicenciaOfficeResource;
use App\Http\Resources\ResponsableResource;
use App\Http\Resources\UserResource;
use App\Models\Equipo;
use App\Models\LicenciaOffice;
use App\Models\Responsable;
use App\Models\User;
use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Buscador global del Inicio: un solo término de texto que se busca a
 * la vez en equipos, responsables, licencias de Office y usuarios, más
 * los filtros de equipo (sede/subsede/ubicación, tipo, estado y "solo
 * sin licencia").
 *
 * Una sola petición en vez de cuatro: los cuatro grupos se calculan con
 * los MISMOS filtros validados una sola vez, y el frontend no tiene que
 * coordinar cuatro cargas distintas.
 *
 * Cómo se aplican los filtros a cada grupo:
 * - Equipos: directamente.
 * - Responsables: los que tienen al menos un equipo que cumple los
 *   filtros (mismo criterio que ya usa ResponsableController).
 * - Licencias: las de un equipo que cumple los filtros. Con
 *   "sin_licencia" el grupo se omite: pedir equipos SIN licencia y a la
 *   vez listar licencias es contradictorio.
 * - Usuarios: no están ligados a equipos, así que con cualquier filtro
 *   de equipo activo el grupo se omite (si no, buscar "juan" con la sede
 *   X mostraría usuarios que no tienen nada que ver con esa sede).
 *
 * Un grupo omitido llega como null; uno sin coincidencias, con total 0.
 * Cada grupo trae como máximo LIMITE_POR_GRUPO resultados y el total
 * real, para que el frontend ofrezca "ver todos en el módulo".
 */
class BusquedaController extends Controller
{
    use FiltraPorUbicacion;

    private const LIMITE_POR_GRUPO = 8;

    public function __invoke(Request $request): JsonResponse
    {
        $validados = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'sede_id' => ['nullable', 'integer'],
            'subsede_id' => ['nullable', 'integer'],
            'ubicacion_formacion_id' => ['nullable', 'integer'],
            'tipo_equipo_id' => ['nullable', 'integer'],
            'estado' => ['nullable', Rule::enum(EstadoEquipo::class)],
            'sin_licencia' => ['nullable', 'boolean'],
        ]);

        $termino = trim($validados['q'] ?? '');
        $hayFiltrosDeEquipo = $this->hayFiltrosDeEquipo($request);

        // Sin texto ni filtros no hay nada que buscar: se evita devolver
        // "todo el sistema" por accidente.
        if ($termino === '' && ! $hayFiltrosDeEquipo) {
            return response()->json([
                'equipos' => null,
                'responsables' => null,
                'licencias' => null,
                'usuarios' => null,
            ]);
        }

        $like = $termino === '' ? null : '%' . $this->escaparLike($termino) . '%';
        $filtroEquipo = $this->filtroEquipo($request);

        return response()->json([
            'equipos' => $this->buscarEquipos($request, $like, $filtroEquipo),
            'responsables' => $this->buscarResponsables($request, $like, $filtroEquipo, $hayFiltrosDeEquipo),
            'licencias' => $request->boolean('sin_licencia')
                ? null
                : $this->buscarLicencias($request, $like, $filtroEquipo, $hayFiltrosDeEquipo),
            'usuarios' => $hayFiltrosDeEquipo ? null : $this->buscarUsuarios($request, $like),
        ]);
    }

    private function buscarEquipos(Request $request, ?string $like, Closure $filtroEquipo): ?array
    {
        if ($request->user()->cannot('viewAny', Equipo::class)) {
            return null;
        }

        $consulta = Equipo::query()
            ->tap($filtroEquipo)
            // Agrupado en where(fn...): sin el paréntesis, los orWhere se
            // escaparían de los filtros y devolverían equipos de cualquier
            // sede o estado.
            ->when($like, fn (Builder $q) => $q->where(fn (Builder $sub) => $sub
                ->where('placa_sena', 'like', $like)
                ->orWhere('serial', 'like', $like)
                ->orWhere('mac', 'like', $like)
                ->orWhere('mac_cableada', 'like', $like)
                ->orWhere('hostname', 'like', $like)
                ->orWhereHas('responsable', fn (Builder $r) => $r
                    ->where('nombre', 'like', $like)
                    ->orWhere('documento', 'like', $like))));

        return $this->grupo(
            $consulta,
            fn (Builder $q) => $q->with(['tipoEquipo', 'responsable', 'ubicacionFormacion.subsede.sede'])->latest(),
            EquipoResource::class
        );
    }

    private function buscarResponsables(Request $request, ?string $like, Closure $filtroEquipo, bool $hayFiltros): ?array
    {
        if ($request->user()->cannot('viewAny', Responsable::class)) {
            return null;
        }

        $consulta = Responsable::query()
            ->when($like, fn (Builder $q) => $q->where(fn (Builder $sub) => $sub
                ->where('nombre', 'like', $like)
                ->orWhere('documento', 'like', $like)
                ->orWhere('correo', 'like', $like)))
            ->when($hayFiltros, fn (Builder $q) => $q->whereHas('equipos', $filtroEquipo));

        return $this->grupo(
            $consulta,
            fn (Builder $q) => $q->withCount('equipos')->orderBy('nombre'),
            ResponsableResource::class
        );
    }

    private function buscarLicencias(Request $request, ?string $like, Closure $filtroEquipo, bool $hayFiltros): ?array
    {
        if ($request->user()->cannot('viewAny', LicenciaOffice::class)) {
            return null;
        }

        $consulta = LicenciaOffice::query()
            ->when($like, fn (Builder $q) => $q->where(fn (Builder $sub) => $sub
                ->where('correo', 'like', $like)
                ->orWhereHas('equipo', fn (Builder $e) => $e->where('placa_sena', 'like', $like))))
            ->when($hayFiltros, fn (Builder $q) => $q->whereHas('equipo', $filtroEquipo));

        return $this->grupo(
            $consulta,
            fn (Builder $q) => $q->with('equipo')->latest(),
            LicenciaOfficeResource::class
        );
    }

    private function buscarUsuarios(Request $request, ?string $like): ?array
    {
        // Sin texto (solo filtros) no tiene sentido listar usuarios.
        if ($like === null || $request->user()->cannot('viewAny', User::class)) {
            return null;
        }

        $consulta = User::query()->where(fn (Builder $sub) => $sub
            ->where('name', 'like', $like)
            ->orWhere('email', 'like', $like));

        return $this->grupo($consulta, fn (Builder $q) => $q->orderBy('name'), UserResource::class);
    }

    /**
     * Cuenta el total real ANTES de ordenar/cargar relaciones (el COUNT
     * no las necesita) y luego trae solo los primeros resultados.
     *
     * @param  class-string<\Illuminate\Http\Resources\Json\JsonResource>  $resource
     */
    private function grupo(Builder $consulta, Closure $preparar, string $resource): array
    {
        $total = (clone $consulta)->count();

        $resultados = $total === 0
            ? collect()
            : $preparar($consulta)->limit(self::LIMITE_POR_GRUPO)->get();

        return [
            'total' => $total,
            'resultados' => $resource::collection($resultados)->resolve(),
        ];
    }

    /**
     * Los filtros de equipo como un closure reutilizable: se aplica tal
     * cual a Equipo y dentro de whereHas('equipos'/'equipo') para
     * Responsables y Licencias — una sola definición del criterio.
     */
    private function filtroEquipo(Request $request): Closure
    {
        [$sedeId, $subsedeId, $ubicacionId] = $this->filtrosUbicacion($request);

        return fn (Builder $q) => $q
            ->filtrarPorUbicacion($sedeId, $subsedeId, $ubicacionId)
            ->when($request->filled('tipo_equipo_id'), fn (Builder $s) => $s->where('tipo_equipo_id', $request->integer('tipo_equipo_id')))
            ->when($request->filled('estado'), fn (Builder $s) => $s->where('estado', $request->input('estado')))
            // Mismo criterio que el contador "Equipos sin licencia" del
            // Inicio y que EquipoController::index().
            ->when(
                $request->boolean('sin_licencia'),
                fn (Builder $s) => $s->doesntHave('licenciaOffice')
                    ->whereNotIn('estado', [EstadoEquipo::DeBaja, EstadoEquipo::Extraviado])
            );
    }

    private function hayFiltrosDeEquipo(Request $request): bool
    {
        return $request->filled('sede_id')
            || $request->filled('subsede_id')
            || $request->filled('ubicacion_formacion_id')
            || $request->filled('tipo_equipo_id')
            || $request->filled('estado')
            || $request->boolean('sin_licencia');
    }

    /**
     * Sin esto, escribir "%" o "_" funcionaría como comodín de SQL:
     * buscar "_" traería TODO. Se escapan para buscarlos literalmente.
     */
    private function escaparLike(string $valor): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $valor);
    }
}