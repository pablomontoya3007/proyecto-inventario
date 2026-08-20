<?php

namespace Database\Factories;

use App\Models\Equipo;
use App\Models\Responsable;
use App\Models\TipoEquipo;
use App\Models\UbicacionFormacion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Equipo>
 */
class EquipoFactory extends Factory
{
    protected $model = Equipo::class;

    // Pesado hacia "activo" a propósito: en un inventario real, la mayoría
    // de los equipos están en uso; los otros estados son la excepción.
    private const ESTADOS = ['activo', 'activo', 'activo', 'mantenimiento', 'de_baja', 'extraviado'];

    private const MARCAS_COMPUTO = ['Dell', 'HP', 'Lenovo', 'Asus'];

    /**
     * Por defecto genera un "Computador de escritorio". Los demás tipos
     * se obtienen encadenando un estado, ej: Equipo::factory()->impresora().
     */
    public function definition(): array
    {
        return array_merge($this->atributosComunes(), [
            'tipo_equipo_id' => TipoEquipo::firstOrCreate(
                ['nombre' => 'Computador de escritorio'],
                ['activo' => true]
            )->id,
            'caracteristicas_tecnicas' => [
                'procesador' => fake()->randomElement(['Intel Core i5', 'Intel Core i7', 'AMD Ryzen 5']),
                'ram_gb' => fake()->randomElement([8, 16, 32]),
                'almacenamiento' => fake()->randomElement(['256GB SSD', '512GB SSD', '1TB SSD']),
                'sistema_operativo' => fake()->randomElement(['Windows 11', 'Windows 10', 'Ubuntu 22.04']),
                'tarjeta_grafica' => fake()->randomElement(['Integrada', 'NVIDIA GTX 1650', 'NVIDIA RTX 3050']),
                'marca' => fake()->randomElement(self::MARCAS_COMPUTO),
                'modelo' => fake()->bothify('OptiPlex-####'),
            ],
        ]);
    }

    /**
     * Campos que no dependen del tipo de equipo: identificadores, red,
     * ubicación, responsable y estado.
     */
    private function atributosComunes(): array
    {
        return [
            'placa_sena' => 'SENA-' . fake()->unique()->numerify('######'),
            'serial' => fake()->unique()->bothify('SN-????????'),
            'mac' => fake()->unique()->macAddress(),
            'mac_cableada' => fake()->optional(0.3)->macAddress(),
            'hostname' => fake()->optional(0.85)->bothify('pc-##??'),
            'responsable_id' => Responsable::factory(),
            'ubicacion_formacion_id' => UbicacionFormacion::factory(),
            'estado' => fake()->randomElement(self::ESTADOS),
        ];
    }

    /**
     * firstOrCreate: si el Seeder ya sembró el catálogo de tipos, lo
     * reutiliza; si no, lo crea. Nunca duplica el mismo tipo dos veces.
     */
    private function tipoPorNombre(string $nombre): int
    {
        return TipoEquipo::firstOrCreate(['nombre' => $nombre], ['activo' => true])->id;
    }

    public function portatil(): static
    {
        return $this->state(fn () => [
            'tipo_equipo_id' => $this->tipoPorNombre('Computador portátil'),
            'caracteristicas_tecnicas' => [
                'procesador' => fake()->randomElement(['Intel Core i5', 'Intel Core i7', 'AMD Ryzen 5']),
                'ram_gb' => fake()->randomElement([8, 16, 32]),
                'almacenamiento' => fake()->randomElement(['256GB SSD', '512GB SSD']),
                'sistema_operativo' => fake()->randomElement(['Windows 11', 'Windows 10']),
                'marca' => fake()->randomElement(self::MARCAS_COMPUTO),
                'modelo' => fake()->bothify('Latitude-####'),
                'tamano_pantalla' => fake()->randomElement(['14"', '15.6"']),
            ],
        ]);
    }

    public function todoEnUno(): static
    {
        return $this->state(fn () => [
            'tipo_equipo_id' => $this->tipoPorNombre('Todo en uno'),
            'caracteristicas_tecnicas' => [
                'procesador' => fake()->randomElement(['Intel Core i5', 'Intel Core i7']),
                'ram_gb' => fake()->randomElement([8, 16]),
                'almacenamiento' => fake()->randomElement(['256GB SSD', '512GB SSD']),
                'sistema_operativo' => 'Windows 11',
                'marca' => fake()->randomElement(self::MARCAS_COMPUTO),
                'modelo' => fake()->bothify('AIO-####'),
                'tamano_pantalla' => '23.8"',
            ],
        ]);
    }

    public function impresora(): static
    {
        return $this->state(fn () => [
            'tipo_equipo_id' => $this->tipoPorNombre('Impresora'),
            'mac_cableada' => null,
            'caracteristicas_tecnicas' => [
                'marca' => fake()->randomElement(['HP', 'Epson', 'Canon', 'Brother']),
                'modelo' => fake()->bothify('LaserJet-####'),
                'tipo' => fake()->randomElement(['Láser', 'Inyección de tinta']),
                'conexion' => fake()->randomElement(['USB', 'Red']),
            ],
        ]);
    }

    public function accessPoint(): static
    {
        return $this->state(fn () => [
            'tipo_equipo_id' => $this->tipoPorNombre('Access Point'),
            'caracteristicas_tecnicas' => [
                'marca' => fake()->randomElement(['Ubiquiti', 'TP-Link', 'Cisco']),
                'modelo' => fake()->bothify('AP-####'),
                'estandar_wifi' => fake()->randomElement(['Wi-Fi 5', 'Wi-Fi 6']),
                'capacidad_usuarios' => fake()->randomElement([30, 50, 100]),
            ],
        ]);
    }

    public function router(): static
    {
        return $this->state(fn () => [
            'tipo_equipo_id' => $this->tipoPorNombre('Router'),
            'caracteristicas_tecnicas' => [
                'marca' => fake()->randomElement(['Cisco', 'MikroTik', 'TP-Link']),
                'modelo' => fake()->bothify('RT-####'),
                'numero_puertos_lan' => fake()->randomElement([4, 8]),
                'soporta_vpn' => fake()->boolean(),
            ],
        ]);
    }

    public function switch(): static
    {
        return $this->state(fn () => [
            'tipo_equipo_id' => $this->tipoPorNombre('Switch'),
            'caracteristicas_tecnicas' => [
                'marca' => fake()->randomElement(['Cisco', 'HP', 'TP-Link']),
                'modelo' => fake()->bothify('SW-####'),
                'numero_puertos' => fake()->randomElement([8, 16, 24, 48]),
                'gestionable' => fake()->boolean(),
            ],
        ]);
    }

    public function otroDispositivo(): static
    {
        return $this->state(fn () => [
            'tipo_equipo_id' => $this->tipoPorNombre('Otro dispositivo de conectividad'),
            'caracteristicas_tecnicas' => [
                'marca' => fake()->company(),
                'modelo' => fake()->bothify('MOD-####'),
                'descripcion' => fake()->sentence(),
            ],
        ]);
    }
}
