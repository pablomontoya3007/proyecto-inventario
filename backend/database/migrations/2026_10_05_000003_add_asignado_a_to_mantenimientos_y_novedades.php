<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Usuario del sistema asignado:
 * - en mantenimientos: quien debe hacer el mantenimiento;
 * - en novedades: quien debe revisarla.
 *
 * nullOnDelete: si el usuario se elimina, el registro queda "sin
 * asignar" en vez de bloquear la eliminación o borrar el historial.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mantenimientos', function (Blueprint $table) {
            $table->foreignId('asignado_a')->nullable()->after('estado')->constrained('users')->nullOnDelete();
        });

        Schema::table('novedades', function (Blueprint $table) {
            $table->foreignId('asignado_a')->nullable()->after('estado')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('mantenimientos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('asignado_a');
        });

        Schema::table('novedades', function (Blueprint $table) {
            $table->dropConstrainedForeignId('asignado_a');
        });
    }
};