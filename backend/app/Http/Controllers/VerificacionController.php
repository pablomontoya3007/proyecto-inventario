<?php

namespace App\Http\Controllers;

use App\Models\Equipo;
use App\Models\LicenciaOffice;
use App\Support\NormalizadorEquipo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Verificaciones en vivo para los formularios: avisan de un duplicado
 * MIENTRAS se escribe, antes de intentar guardar. Son solo lectura y
 * comparan el valor EXACTO (no LIKE), igual que las restricciones
 * únicas de la BD, para que el aviso y el rechazo del servidor
 * coincidan siempre.
 *
 * No reemplazan la validación de EquipoRequest / LicenciaOfficeRequest:
 * si dos personas guardan lo mismo a la vez, el servidor lo sigue
 * rechazando.
 */
class VerificacionController extends Controller
{
    /**
     * GET /equipos/verificar?placa_sena=&serial=&ignorar_id=
     * -> { placa_sena: Coincidencia|null, serial: Coincidencia|null }
     *
     * withTrashed: un equipo eliminado (soft delete) sigue ocupando su
     * placa y su serial en el índice único de la BD.
     */
    public function equipo(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Equipo::class);

        $request->validate([
            'placa_sena' => ['nullable'],
            'serial' => ['nullable'],
            'ignorar_id' => ['nullable', 'integer'],
        ]);

        // Mismo normalizador que EquipoRequest: lo que aquí se compara es
        // exactamente lo que se guardaría.
        $placa = NormalizadorEquipo::texto($request->input('placa_sena'));
        $serial = NormalizadorEquipo::texto($request->input('serial'));
        $ignorarId = $request->integer('ignorar_id') ?: null;

        return response()->json([
            'placa_sena' => $this->buscarEquipo('placa_sena', $placa, $ignorarId),
            'serial' => $this->buscarEquipo('serial', $serial, $ignorarId),
        ]);
    }

    /**
     * GET /licencias-office/verificar?equipo_id=&correo=&ignorar_id=
     * -> {
     *      equipo: { id, correo, estado_label } | null   (licencia que ya tiene ese equipo)
     *      correo: [{ licencia_id, placa_sena }]         (otras licencias con ese correo)
     *    }
     *
     * Nunca devuelve contraseñas.
     */
    public function licencia(Request $request): JsonResponse
    {
        $this->authorize('viewAny', LicenciaOffice::class);

        $request->validate([
            'equipo_id' => ['nullable', 'integer'],
            'correo' => ['nullable', 'string', 'max:255'],
            'ignorar_id' => ['nullable', 'integer'],
        ]);

        $ignorarId = $request->integer('ignorar_id') ?: null;
        $equipoId = $request->integer('equipo_id') ?: null;
        $correo = trim((string) $request->input('correo', ''));

        $licenciaDelEquipo = $equipoId
            ? LicenciaOffice::query()
                ->where('equipo_id', $equipoId)
                ->when($ignorarId, fn ($q) => $q->whereKeyNot($ignorarId))
                ->first()
            : null;

        $licenciasConCorreo = $correo !== ''
            ? LicenciaOffice::query()
                ->with('equipo')
                ->where('correo', $correo)
                ->when($ignorarId, fn ($q) => $q->whereKeyNot($ignorarId))
                ->limit(10)
                ->get()
            : collect();

        return response()->json([
            'equipo' => $licenciaDelEquipo ? [
                'id' => $licenciaDelEquipo->id,
                'correo' => $licenciaDelEquipo->correo,
                'estado_label' => $licenciaDelEquipo->estado_licencia?->label(),
            ] : null,
            'correo' => $licenciasConCorreo->map(fn (LicenciaOffice $licencia) => [
                'licencia_id' => $licencia->id,
                'placa_sena' => $licencia->equipo?->placa_sena,
            ])->values(),
        ]);
    }

    /**
     * La comparación con where('columna', valor) usa la collation de la
     * columna (utf8mb4_unicode_ci por defecto): no distingue mayúsculas,
     * igual que el índice único.
     */
    private function buscarEquipo(string $columna, ?string $valor, ?int $ignorarId): ?array
    {
        if ($valor === null) {
            return null;
        }

        $equipo = Equipo::withTrashed()
            ->with(['tipoEquipo', 'ubicacionFormacion.subsede'])
            ->where($columna, $valor)
            ->when($ignorarId, fn ($q) => $q->whereKeyNot($ignorarId))
            ->first();

        if (!$equipo) {
            return null;
        }

        return [
            'id' => $equipo->id,
            'placa_sena' => $equipo->placa_sena,
            'serial' => $equipo->serial,
            'tipo_equipo' => $equipo->tipoEquipo?->nombre,
            'ubicacion' => collect([$equipo->ubicacionFormacion?->subsede?->nombre, $equipo->ubicacionFormacion?->nombre])
                ->filter()
                ->implode(' / ') ?: null,
            'eliminado' => $equipo->trashed(),
        ];
    }
}