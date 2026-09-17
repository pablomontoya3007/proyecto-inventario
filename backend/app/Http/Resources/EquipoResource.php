<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EquipoResource extends JsonResource
{
    /**
     * Sirve tanto para un listado liviano (sin relaciones precargadas)
     * como para la hoja de vida completa (sección 2 de los requisitos):
     * la diferencia la marca qué relaciones cargó el Controller con
     * ->with(...) antes de pasar el modelo aquí, no dos clases distintas.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'placa_sena' => $this->placa_sena,
            'serial' => $this->serial,
            'mac' => $this->mac,
            'mac_cableada' => $this->mac_cableada,
            'hostname' => $this->hostname,
            'estado' => $this->estado?->value,
            'estado_label' => $this->estado?->label(),
            'caracteristicas_tecnicas' => $this->caracteristicas_tecnicas,
            'tipo_equipo' => new TipoEquipoResource($this->whenLoaded('tipoEquipo')),
            'responsable' => new ResponsableResource($this->whenLoaded('responsable')),
            'ubicacion_formacion' => new UbicacionFormacionResource($this->whenLoaded('ubicacionFormacion')),
            'licencia_office' => new LicenciaOfficeResource($this->whenLoaded('licenciaOffice')),
            'observaciones' => ObservacionResource::collection($this->whenLoaded('observaciones')),
            'mantenimientos' => MantenimientoResource::collection($this->whenLoaded('mantenimientos')),
            'creado_en' => $this->created_at,
            'actualizado_en' => $this->updated_at,
        ];
    }
}
