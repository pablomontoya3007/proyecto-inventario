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
 * subconjunto de equipos, no todos: EquipoSeeder ya le asigna una
 * licencia (con su propio patrón de correo y distribución de estados)
 * a ~70% de los equipos de cómputo al crearlos, así que aquí solo se
 * completan los que quedaron SIN licencia — de lo contrario chocaría
 * con la restricción única equipo_id al intentar crear una segunda
 * licencia para un equipo que ya tiene una.
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
            ->whereDoesntHave('licenciaOffice')
            ->inRandomOrder()
            ->get();

        if ($equiposDeComputo->isEmpty()) {
            $this->command->warn('No hay equipos de cómputo sin licencia — nada que sembrar aquí.');
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