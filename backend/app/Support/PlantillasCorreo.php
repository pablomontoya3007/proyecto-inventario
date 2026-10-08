<?php

namespace App\Support;

use App\Models\Equipo;
use App\Models\Novedad;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Textos de las notificaciones automáticas. Separados de los
 * controladores para que cambiar la redacción no obligue a tocar lógica.
 * Devuelven [asunto, cuerpo] en texto plano; CorreoSistemaMail se
 * encarga de escaparlo y darle formato HTML.
 *
 * El nombre que ven los destinatarios es "Inventario SENA".
 */
final class PlantillasCorreo
{
    private const NOMBRE_SISTEMA = 'Inventario SENA';

    /**
     * Al usuario asignado a un mantenimiento (individual o masivo).
     *
     * @param  Collection<int, Equipo>  $equipos  con tipoEquipo y ubicacionFormacion.subsede.sede cargados
     * @return array{0: string, 1: string}
     */
    public static function mantenimientoAsignado(
        Collection $equipos,
        string $fechaProgramada,
        ?string $descripcion,
        User $programadoPor,
        User $asignado
    ): array {
        $fecha = Carbon::parse($fechaProgramada)->format('d/m/Y');
        $porUbicacion = $equipos->groupBy(fn (Equipo $equipo) => self::ubicacion($equipo));
        $total = $equipos->count();

        $asunto = match (true) {
            $total === 1 => "Se te asignó un mantenimiento: equipo {$equipos->first()->placa_sena} ({$fecha})",
            $porUbicacion->count() === 1 => 'Se te asignó un mantenimiento: '
                . ($equipos->first()->ubicacionFormacion?->nombre ?? 'ubicación') . " - {$total} equipos ({$fecha})",
            default => "Se te asignó un mantenimiento: {$total} equipos ({$fecha})",
        };

        $lineas = [
            "Hola {$asignado->name},",
            '',
            'Se te asignó un mantenimiento en el sistema ' . self::NOMBRE_SISTEMA . '.',
            '',
            "Fecha programada: {$fecha}",
            "Programado por: {$programadoPor->name}",
        ];

        if ($descripcion) {
            $lineas[] = "Descripción: {$descripcion}";
        }

        foreach ($porUbicacion as $ubicacion => $equiposDeUbicacion) {
            $lineas[] = '';
            $lineas[] = "Ubicación: {$ubicacion}";
            $lineas[] = "Equipos ({$equiposDeUbicacion->count()}):";

            foreach ($equiposDeUbicacion as $equipo) {
                $lineas[] = '- ' . self::equipo($equipo);
            }
        }

        return [$asunto, implode("\n", $lineas)];
    }

    /**
     * Al responsable del equipo: le avisa que hay una novedad en un
     * equipo a su cargo (y quién la va a revisar, si ya está asignada).
     *
     * @return array{0: string, 1: string}
     */
    public static function novedadParaResponsable(Novedad $novedad): array
    {
        $responsable = $novedad->equipo?->responsable;

        $lineas = [
            'Hola' . ($responsable ? " {$responsable->nombre}" : '') . ',',
            '',
            'Se registró una novedad en un equipo a tu cargo.',
            '',
            ...self::datosNovedad($novedad, incluirResponsable: false, incluirAsignado: true),
        ];

        return ['Novedad registrada en el equipo ' . ($novedad->equipo?->placa_sena ?? ''), implode("\n", $lineas)];
    }

    /**
     * Al usuario asignado para revisar la novedad.
     *
     * @return array{0: string, 1: string}
     */
    public static function novedadAsignada(Novedad $novedad): array
    {
        $lineas = [
            'Hola' . ($novedad->asignado ? " {$novedad->asignado->name}" : '') . ',',
            '',
            'Se te asignó revisar una novedad registrada en el sistema ' . self::NOMBRE_SISTEMA . '.',
            '',
            ...self::datosNovedad($novedad, incluirResponsable: true, incluirAsignado: false),
        ];

        return ['Se te asignó una novedad: equipo ' . ($novedad->equipo?->placa_sena ?? ''), implode("\n", $lineas)];
    }

    /**
     * Placa SENA, usuario que la reportó y descripción (lo que pide el
     * requisito), más tipo y ubicación para ubicar el equipo.
     */
    private static function datosNovedad(Novedad $novedad, bool $incluirResponsable, bool $incluirAsignado): array
    {
        $equipo = $novedad->equipo;

        $lineas = [
            'Placa SENA: ' . ($equipo?->placa_sena ?? 'Sin placa'),
            'Tipo de equipo: ' . ($equipo?->tipoEquipo?->nombre ?? 'Sin tipo'),
            'Ubicación: ' . ($equipo ? self::ubicacion($equipo) : 'Sin ubicación'),
        ];

        if ($incluirResponsable) {
            $lineas[] = 'Responsable del equipo: ' . ($equipo?->responsable?->nombre ?? 'Sin responsable');
        }

        $lineas[] = 'Reportada por: ' . ($novedad->usuario?->name ?? 'Usuario del sistema');

        if ($incluirAsignado && $novedad->asignado) {
            $lineas[] = "Asignada para revisión a: {$novedad->asignado->name}";
        }

        $lineas[] = 'Fecha: ' . $novedad->created_at?->format('d/m/Y H:i');
        $lineas[] = '';
        $lineas[] = 'Descripción:';
        $lineas[] = $novedad->descripcion;

        return $lineas;
    }

    /**
     * Pública: NovedadResource la usa para mostrar la ubicación en
     * pantalla con el mismo formato que el correo.
     */
    public static function ubicacion(Equipo $equipo): string
    {
        $ubicacion = $equipo->ubicacionFormacion;

        if (!$ubicacion) {
            return 'Sin ubicación';
        }

        return collect([$ubicacion->subsede?->sede?->nombre, $ubicacion->subsede?->nombre, $ubicacion->nombre])
            ->filter()
            ->implode(' / ');
    }

    private static function equipo(Equipo $equipo): string
    {
        return collect([
            $equipo->placa_sena,
            $equipo->tipoEquipo?->nombre,
            $equipo->serial ? "Serial {$equipo->serial}" : null,
        ])->filter()->implode(' · ');
    }
}