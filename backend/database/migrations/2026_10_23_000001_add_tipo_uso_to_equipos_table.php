<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Nuevo campo "tipo de uso" (enum App\Enums\TipoUso: formacion,
 * administrativo, no_aplica).
 *
 * Todos los equipos que ya existen quedan como "formacion": la columna
 * es NOT NULL con ese valor por defecto, así que MySQL lo llena solo al
 * agregarla. El UPDATE de abajo es una segunda garantía explícita
 * (incluye los equipos eliminados con soft delete, por si se restauran).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('equipos', function (Blueprint $table) {
            $table->string('tipo_uso', 20)->default('formacion')->after('estado');
            $table->index('tipo_uso');
        });

        DB::table('equipos')
            ->whereNull('tipo_uso')
            ->orWhere('tipo_uso', '')
            ->update(['tipo_uso' => 'formacion']);
    }

    public function down(): void
    {
        Schema::table('equipos', function (Blueprint $table) {
            $table->dropIndex(['tipo_uso']);
            $table->dropColumn('tipo_uso');
        });
    }
};