<?php

namespace App\Observers;

use App\Models\Auditoria;
use Illuminate\Database\Eloquent\Model;

/**
 * Un solo Observer reutilizado por todos los modelos auditados (ver el
 * booted() de cada uno), en vez de repetir la misma lógica de
 * created/updated/deleted por separado en cada modelo.
 *
 * Solo registra el cambio si hay un usuario autenticado en la petición
 * — así Tinker y los seeders no llenan la auditoría de ruido; lo que
 * interesa aquí es "qué hizo la gente a través del sistema", no cómo
 * se sembraron los datos de prueba.
 *
 * Un modelo puede excluir campos sensibles definiendo su propio método
 * camposAuditablesExcluidos() (ver LicenciaOffice, que excluye
 * password_cifrado) — así ese dato nunca queda guardado, ni siquiera
 * cifrado, en una segunda tabla.
 */
class AuditoriaObserver
{
    // Nunca se audita el cambio de estas columnas por sí solo: son
    // ruido (updated_at cambia en cada guardado) o metadatos que no
    // aportan nada al historial de cambios en sí.
    private const CAMPOS_SIEMPRE_EXCLUIDOS = ['updated_at', 'created_at'];

    public function created(Model $model): void
    {
        $this->registrar($model, 'creado', $this->filtrarCampos($model, $model->getAttributes()));
    }

    public function updated(Model $model): void
    {
        $cambiados = $this->filtrarCampos($model, $model->getChanges());

        if (empty($cambiados)) {
            return;
        }

        $original = $model->getOriginal();

        $detalle = collect($cambiados)
            ->mapWithKeys(fn ($valorNuevo, $campo) => [
                $campo => ['antes' => $original[$campo] ?? null, 'despues' => $valorNuevo],
            ])
            ->toArray();

        $this->registrar($model, 'actualizado', $detalle);
    }

    public function deleted(Model $model): void
    {
        $this->registrar($model, 'eliminado', $this->filtrarCampos($model, $model->getOriginal()));
    }

    private function registrar(Model $model, string $accion, array $cambios): void
    {
        if (!auth()->check()) {
            return;
        }

        Auditoria::create([
            'user_id' => auth()->id(),
            'accion' => $accion,
            'auditable_type' => $model::class,
            'auditable_id' => $model->getKey(),
            'cambios' => $cambios,
        ]);
    }

    private function filtrarCampos(Model $model, array $atributos): array
    {
        $excluidos = array_merge(
            self::CAMPOS_SIEMPRE_EXCLUIDOS,
            method_exists($model, 'camposAuditablesExcluidos') ? $model->camposAuditablesExcluidos() : []
        );

        return collect($atributos)->except($excluidos)->toArray();
    }
}
