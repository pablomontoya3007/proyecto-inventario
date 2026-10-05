<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Correo del responsable: a donde llegan las notificaciones de novedades
 * de sus equipos. Opcional — los responsables ya registrados no lo
 * tienen, y sin correo la novedad se registra igual (solo no se envía).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('responsables', function (Blueprint $table) {
            $table->string('correo', 255)->nullable()->after('cargo');
        });
    }

    public function down(): void
    {
        Schema::table('responsables', function (Blueprint $table) {
            $table->dropColumn('correo');
        });
    }
};