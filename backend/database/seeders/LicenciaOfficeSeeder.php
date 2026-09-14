<?php

namespace Database\Seeders;

use App\Enums\EstadoLicencia;
use App\Models\Equipo;
use App\Models\LicenciaOffice;
use Illuminate\Database\Seeder;

/**
 * Solo se le asigna licencia a equipos de cómputo (portátil, escritorio,
 * todo en uno) — no tendría sentido una licencia de Office en un router
 * o una impresora. equipo_id es único por licencia, así que se toma un
 * subconjunto de equipos, no todos.
 *
 * password_cifrado se asigna en texto plano aquí mismo: el cast
 * 'encrypted' del modelo la cifra sola al guardar, igual que hace
 * LicenciaOfficeController::store() en producción — el seeder no
 * necesita repetir esa lógica.
 */
class LicenciaOfficeSeeder extends Seeder
{
    // 60% activas, 20% vencidas, 20% suspendidas — así el reporte de
    // Fase 5 tiene algo real que mostrar en cada categoría.
    private const DISTRIBUCION_ESTADOS = [
        EstadoLicencia::Activa,
        EstadoLicencia::Activa,
        EstadoLicencia::Activa,
        EstadoLicencia::Vencida,
        EstadoLicencia::Suspendida,
    ];

    public function run(): void
    {
        $equiposDeComputo = Equipo::query()
            ->whereHas('tipoEquipo', fn ($q) => $q->whereIn('nombre', [
                'Computador portátil',
                'Computador de escritorio',
                'Todo en uno',
            ]))
            ->inRandomOrder()
            ->get();

        if ($equiposDeComputo->isEmpty()) {
            $this->command->warn('No hay equipos de cómputo sembrados todavía — corre EquipoSeeder primero.');
            return;
        }

        foreach ($equiposDeComputo as $indice => $equipo) {
            $estado = self::DISTRIBUCION_ESTADOS[$indice % count(self::DISTRIBUCION_ESTADOS)];

            LicenciaOffice::create([
                'equipo_id' => $equipo->id,
                'correo' => 'licencia.'.$equipo->placa_sena.'@sena.edu.co',
                'password_cifrado' => 'ClaveSegura'.random_int(1000, 9999).'!',
                'estado_licencia' => $estado,
            ]);
        }
    }
}