<?php

namespace Tests\Feature;

use App\Enums\EstadoEquipo;
use App\Models\Equipo;
use App\Models\LicenciaOffice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReporteEquiposSinLicenciaTest extends TestCase
{
    use RefreshDatabase;

    public function test_solo_lista_equipos_en_uso_sin_licencia(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $sinLicencia = Equipo::factory()->create(['estado' => EstadoEquipo::Activo]);
        $enMantenimiento = Equipo::factory()->create(['estado' => EstadoEquipo::Mantenimiento]);
        Equipo::factory()->create(['estado' => EstadoEquipo::DeBaja]);
        $conLicencia = Equipo::factory()->create(['estado' => EstadoEquipo::Activo]);
        LicenciaOffice::factory()->create(['equipo_id' => $conLicencia->id]);

        $respuesta = $this->getJson('/api/reportes/licencias/sin-licencia')->assertOk();

        $placas = collect($respuesta->json('listado'))->pluck('placa_sena')->sort()->values()->all();
        $esperadas = collect([$sinLicencia->placa_sena, $enMantenimiento->placa_sena])->sort()->values()->all();

        $this->assertSame($esperadas, $placas);
        $this->assertSame(2, $respuesta->json('total'));
        $this->assertSame(2, collect($respuesta->json('por_tipo'))->sum('total'));
    }

    public function test_filtra_por_tipo_y_descarga_excel_y_pdf(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $equipo = Equipo::factory()->create(['estado' => EstadoEquipo::Activo]);
        Equipo::factory()->router()->create(['estado' => EstadoEquipo::Activo]);

        $this->getJson('/api/reportes/licencias/sin-licencia?tipo_equipo_id=' . $equipo->tipo_equipo_id)
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('listado.0.placa_sena', $equipo->placa_sena);

        $this->get('/api/reportes/licencias/sin-licencia/excel')->assertOk();
        $this->get('/api/reportes/licencias/sin-licencia/pdf')->assertOk();
        // Regresión: este export estaba sobrescrito con la plantilla de importación.
        $this->get('/api/reportes/licencias/excel')->assertOk();
    }

    public function test_exige_sesion(): void
    {
        $this->getJson('/api/reportes/licencias/sin-licencia')->assertUnauthorized();
    }
}