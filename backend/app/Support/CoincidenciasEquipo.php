<?php

namespace App\Support;

use App\Models\Equipo;
use App\Models\Mantenimiento;
use App\Models\Novedad;
use App\Models\Observacion;
use App\Models\Traslado;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Explica POR QUÉ un equipo apareció en el buscador global: en qué
 * campo está el término y un fragmento del texto donde aparece.
 *
 * Sin esto, buscar "ruby" mostraría el equipo pero no diría que la
 * coincidencia está en su característica "color", o en una observación
 * de hace un año — la persona tendría que abrir la hoja de vida para
 * adivinarlo.
 *
 * Se calcula SOLO para los pocos equipos que ya se van a mostrar (como
 * máximo 8): una consulta por tabla relacionada, no una por equipo.
 *
 * La comparación ignora mayúsculas y tildes ("tamano" encuentra
 * "Tamaño"), igual que la collation de MySQL/MariaDB que usó la
 * consulta principal: así casi nunca aparece un equipo sin explicación.
 */
final class CoincidenciasEquipo
{
    private const MAX_POR_EQUIPO = 5;

    private const LARGO_FRAGMENTO = 90;

    private readonly string $terminoNormalizado;

    /**
     * @param  string  $termino  Lo que escribió la persona, tal cual.
     * @param  string  $like  El mismo patrón LIKE (ya escapado) que usó la consulta principal.
     */
    public function __construct(private readonly string $termino, private readonly string $like)
    {
        $this->terminoNormalizado = self::normalizar($termino);
    }

    /**
     * @param  Collection<int, Equipo>  $equipos  Con 'responsable' ya cargado.
     * @return array<int, list<array{campo: string, valor: string}>> Indexado por id de equipo.
     */
    public function para(Collection $equipos): array
    {
        if ($equipos->isEmpty()) {
            return [];
        }

        $ids = $equipos->modelKeys();
        $relacionadas = $this->coincidenciasRelacionadas($ids);

        $resultado = [];

        foreach ($equipos as $equipo) {
            $coincidencias = [
                ...$this->coincidenciasPropias($equipo),
                ...($relacionadas[$equipo->id] ?? []),
            ];

            $resultado[$equipo->id] = array_slice($coincidencias, 0, self::MAX_POR_EQUIPO);
        }

        return $resultado;
    }

    /**
     * Campos del propio equipo, en el orden en que importan a quien busca.
     */
    private function coincidenciasPropias(Equipo $equipo): array
    {
        $coincidencias = [];

        $campos = [
            'Placa SENA' => $equipo->placa_sena,
            'Serial' => $equipo->serial,
            'MAC' => $equipo->mac,
            'MAC cableada' => $equipo->mac_cableada,
            'Hostname' => $equipo->hostname,
            'Responsable' => $equipo->responsable
                ? trim($equipo->responsable->nombre . ' · ' . $equipo->responsable->documento, ' ·')
                : null,
        ];

        foreach ($campos as $campo => $valor) {
            if ($this->contiene($valor)) {
                $coincidencias[] = ['campo' => $campo, 'valor' => $this->fragmento($valor)];
            }
        }

        // Características técnicas: puede coincidir el NOMBRE de la
        // característica ("ruby" como clave) o su VALOR (color: ruby).
        foreach ($equipo->caracteristicas_tecnicas ?? [] as $clave => $valor) {
            $texto = is_scalar($valor) ? (string) $valor : json_encode($valor, JSON_UNESCAPED_UNICODE);

            if ($this->contiene((string) $clave) || $this->contiene($texto)) {
                $coincidencias[] = [
                    'campo' => 'Característica · ' . $clave,
                    'valor' => $this->fragmento($texto),
                ];
            }
        }

        return $coincidencias;
    }

    /**
     * Observaciones, novedades, mantenimientos y traslados de los equipos
     * mostrados — una consulta por tabla, con el mismo LIKE de la búsqueda.
     *
     * @param  list<int>  $ids
     * @return array<int, list<array{campo: string, valor: string}>>
     */
    private function coincidenciasRelacionadas(array $ids): array
    {
        $porEquipo = [];

        $agregar = function (int $equipoId, string $campo, ?string $texto) use (&$porEquipo): void {
            if ($this->contiene($texto)) {
                $porEquipo[$equipoId][] = ['campo' => $campo, 'valor' => $this->fragmento($texto)];
            }
        };

        Observacion::query()
            ->whereIn('equipo_id', $ids)
            ->where('descripcion', 'like', $this->like)
            ->latest()
            ->get(['equipo_id', 'descripcion', 'created_at'])
            ->each(fn ($obs) => $agregar(
                $obs->equipo_id,
                'Observación del ' . $obs->created_at?->format('d/m/Y'),
                $obs->descripcion
            ));

        Novedad::query()
            ->whereIn('equipo_id', $ids)
            ->where(fn ($q) => $q->where('descripcion', 'like', $this->like)->orWhere('nota_resolucion', 'like', $this->like))
            ->latest()
            ->get(['equipo_id', 'descripcion', 'nota_resolucion', 'created_at'])
            ->each(function ($novedad) use ($agregar) {
                $fecha = $novedad->created_at?->format('d/m/Y');
                $agregar($novedad->equipo_id, "Novedad del {$fecha}", $novedad->descripcion);
                $agregar($novedad->equipo_id, "Resolución de novedad del {$fecha}", $novedad->nota_resolucion);
            });

        Mantenimiento::query()
            ->whereIn('equipo_id', $ids)
            ->where('descripcion', 'like', $this->like)
            ->latest('fecha_programada')
            ->get(['equipo_id', 'descripcion', 'fecha_programada'])
            ->each(fn ($mant) => $agregar(
                $mant->equipo_id,
                'Mantenimiento del ' . $mant->fecha_programada?->format('d/m/Y'),
                $mant->descripcion
            ));

        Traslado::query()
            ->whereIn('equipo_id', $ids)
            ->where('motivo', 'like', $this->like)
            ->latest('fecha_traslado')
            ->get(['equipo_id', 'motivo', 'fecha_traslado'])
            ->each(fn ($traslado) => $agregar(
                $traslado->equipo_id,
                'Traslado del ' . $traslado->fecha_traslado?->format('d/m/Y'),
                $traslado->motivo
            ));

        return $porEquipo;
    }

    private function contiene(?string $texto): bool
    {
        return $texto !== null
            && $texto !== ''
            && str_contains(self::normalizar($texto), $this->terminoNormalizado);
    }

    /**
     * Textos largos (una observación de varios párrafos) se recortan
     * alrededor de la coincidencia, para que se vea DÓNDE está.
     */
    private function fragmento(string $texto): string
    {
        $texto = trim(preg_replace('/\s+/u', ' ', $texto));

        if (mb_strlen($texto) <= self::LARGO_FRAGMENTO) {
            return $texto;
        }

        // Si la coincidencia fue solo por tildes, mb_stripos no la ubica:
        // se muestra el inicio del texto.
        $posicion = mb_stripos($texto, $this->termino) ?: 0;
        $inicio = max(0, $posicion - 30);
        $recorte = mb_substr($texto, $inicio, self::LARGO_FRAGMENTO);
        $cortaAlFinal = $inicio + self::LARGO_FRAGMENTO < mb_strlen($texto);

        // Cortar en un espacio, no a mitad de palabra ("…taló" -> "…el").
        if ($inicio > 0 && ($espacio = mb_strpos($recorte, ' ')) !== false && $espacio < 15) {
            $recorte = mb_substr($recorte, $espacio + 1);
        }
        if ($cortaAlFinal && ($espacio = mb_strrpos($recorte, ' ')) !== false && $espacio > mb_strlen($recorte) - 15) {
            $recorte = mb_substr($recorte, 0, $espacio);
        }

        return ($inicio > 0 ? '… ' : '') . $recorte . ($cortaAlFinal ? ' …' : '');
    }

    private static function normalizar(string $texto): string
    {
        return Str::lower(Str::ascii($texto));
    }
}