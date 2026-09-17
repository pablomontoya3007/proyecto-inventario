<?php

namespace App\Http\Requests;

use App\Models\Equipo;
use Illuminate\Contracts\Validation\Validator;

class TrasladoRequest extends BaseFormRequest
{
    /**
     * Solo existe para CREAR: los traslados son inmutables una vez
     * registrados (igual que las observaciones) — un error de captura se
     * corrige con un traslado nuevo, no editando el histórico.
     *
     * ubicacion_origen_id no se valida aquí a propósito: nunca lo escoge
     * quien llena el formulario, lo captura el Controller directo de la
     * ubicación actual del equipo, para que el historial no pueda mentir.
     */
    public function rules(): array
    {
        return [
            'equipo_id' => ['required', 'integer', 'exists:equipos,id'],
            'ubicacion_destino_id' => ['required', 'integer', 'exists:ubicaciones_formacion,id'],
            'fecha_traslado' => ['required', 'date'],
            'motivo' => ['nullable', 'string', 'max:500'],
        ];
    }

    protected function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if (!$this->filled('equipo_id') || !$this->filled('ubicacion_destino_id')) {
                return;
            }

            $equipo = Equipo::find($this->input('equipo_id'));

            if ($equipo && (int) $equipo->ubicacion_formacion_id === (int) $this->input('ubicacion_destino_id')) {
                $validator->errors()->add(
                    'ubicacion_destino_id',
                    'El equipo ya está en esa ubicación — no hace falta un traslado.'
                );
            }
        });
    }
}