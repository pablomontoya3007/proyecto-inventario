<?php

namespace Database\Seeders;

use App\Models\Sede;
use App\Models\Subsede;
use App\Models\UbicacionFormacion;
use Database\Factories\SubsedeFactory;
use Database\Factories\UbicacionFormacionFactory;
use Illuminate\Database\Seeder;

class EstructuraSeeder extends Seeder
{
    /**
     * Construye Sede -> Subsede -> Ubicación con una cantidad aleatoria
     * distinta de hijos por cada padre.
     *
     * Nota sobre el error que salió al correr esto: Factory::count() exige
     * un entero, no una función — no se puede pedir "una cantidad distinta
     * por cada padre" con ->has()->count(fn () => rand(...)). En vez de
     * eso, se crea un nivel a la vez y, para cada instancia, se calcula su
     * propia cantidad de hijos con ->each().
     *
     * Los nombres se reparten con sequence() a partir de una lista ya
     * barajada y recortada al tamaño exacto que se necesita, para que
     * nunca se repita un nombre dentro del mismo padre (que es justo lo
     * que exige la restricción unique de la tabla) sin depender de
     * fake()->unique(), que se agotaría antes de terminar.
     */
    public function run(): void
    {
        Sede::factory()
            ->count(4)
            ->create()
            ->each(function (Sede $sede) {
                $cantidadSubsedes = rand(2, 3);

                $subsedes = Subsede::factory()
                    ->count($cantidadSubsedes)
                    ->sequence(...$this->estadosConNombres(SubsedeFactory::NOMBRES, $cantidadSubsedes, 'Subsede '))
                    ->for($sede)
                    ->create();

                $subsedes->each(function (Subsede $subsede) {
                    $cantidadUbicaciones = rand(2, 4);

                    UbicacionFormacion::factory()
                        ->count($cantidadUbicaciones)
                        ->sequence(...$this->estadosConNombres(UbicacionFormacionFactory::NOMBRES, $cantidadUbicaciones))
                        ->for($subsede)
                        ->create();
                });
            });
    }

    /**
     * Baraja el catálogo de nombres, toma exactamente $cantidad y los
     * convierte en arrays de estado ['nombre' => ...] listos para
     * ->sequence(...). Garantiza $cantidad nombres distintos sin repetir,
     * sin tocar el estado global de fake()->unique().
     */
    private function estadosConNombres(array $nombres, int $cantidad, string $prefijo = ''): array
    {
        return collect($nombres)
            ->shuffle()
            ->take($cantidad)
            ->map(fn (string $nombre) => ['nombre' => $prefijo . $nombre])
            ->all();
    }
}
