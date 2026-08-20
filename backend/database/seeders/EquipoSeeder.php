<?php

namespace Database\Seeders;

use App\Models\Equipo;
use App\Models\Observacion;
use App\Models\Responsable;
use App\Models\UbicacionFormacion;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Seeder;

class EquipoSeeder extends Seeder
{
    private const ESTADOS_COMPUTO = ['portatil', 'portatil', 'escritorio', 'escritorio', 'todoEnUno'];
    private const ESTADOS_RED = ['impresora', 'accessPoint', 'router', 'switch', 'otroDispositivo'];

    /**
     * Distribuye equipos de todos los tipos entre las ubicaciones ya
     * sembradas, cada uno con un responsable existente (nunca uno nuevo:
     * usamos ->for() para apuntar a los que ya creó EstructuraSeeder /
     * ResponsableSeeder). A los de cómputo casi siempre se les agrega
     * licencia de Office y algunas observaciones.
     */
    public function run(): void
    {
        $ubicaciones = UbicacionFormacion::all();
        $responsables = Responsable::all();
        $usuarios = User::all();

        if ($ubicaciones->isEmpty() || $responsables->isEmpty()) {
            $this->command->warn('Corre EstructuraSeeder y ResponsableSeeder antes que EquipoSeeder.');

            return;
        }

        foreach ($ubicaciones as $ubicacion) {
            $cantidadComputo = rand(3, 6);
            for ($i = 0; $i < $cantidadComputo; $i++) {
                $equipo = $this->crearEquipoDeComputo($ubicacion, $responsables);
                $this->agregarLicenciaYObservaciones($equipo, $usuarios);
            }

            $cantidadRed = rand(1, 2);
            for ($i = 0; $i < $cantidadRed; $i++) {
                $this->crearEquipoDeRed($ubicacion, $responsables);
            }
        }
    }

    private function crearEquipoDeComputo(UbicacionFormacion $ubicacion, Collection $responsables): Equipo
    {
        $estado = fake()->randomElement(self::ESTADOS_COMPUTO);

        // 'escritorio' no tiene estado propio en la factory porque ya es
        // el definition() por defecto de EquipoFactory.
        $factory = $estado === 'escritorio' ? Equipo::factory() : Equipo::factory()->{$estado}();

        return $factory
            ->for($ubicacion, 'ubicacionFormacion')
            ->for($responsables->random(), 'responsable')
            ->create();
    }

    private function crearEquipoDeRed(UbicacionFormacion $ubicacion, Collection $responsables): Equipo
    {
        $estado = fake()->randomElement(self::ESTADOS_RED);

        return Equipo::factory()->{$estado}()
            ->for($ubicacion, 'ubicacionFormacion')
            ->for($responsables->random(), 'responsable')
            ->create();
    }

    private function agregarLicenciaYObservaciones(Equipo $equipo, Collection $usuarios): void
    {
        // No todos los equipos de cómputo tienen licencia registrada.
        if (fake()->boolean(70)) {
            $equipo->licenciaOffice()->create([
                'correo' => str($equipo->placa_sena)->lower()->replace('-', '') . '@sena.edu.co',
                'password_cifrado' => fake()->password(10, 14),
                'estado_licencia' => fake()->randomElement(['activa', 'activa', 'vencida']),
            ]);
        }

        if ($usuarios->isEmpty()) {
            return;
        }

        // OJO: rand(0, 3) puede devolver 0. range(1, rand(0, 3)) sería un
        // error clásico aquí: si rand() da 0, range(1, 0) en PHP cuenta
        // HACIA ATRÁS y devuelve [1, 0] (dos elementos, no cero). Por eso
        // se precalcula la cantidad y se usa un for normal.
        $cantidadObservaciones = rand(0, 3);
        for ($i = 0; $i < $cantidadObservaciones; $i++) {
            Observacion::factory()->create([
                'equipo_id' => $equipo->id,
                'user_id' => $usuarios->random()->id,
            ]);
        }
    }
}
