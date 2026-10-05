<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Novedades: algo que le sucede a un equipo y requiere atención (daño,
 * falla, faltante...). A diferencia de Observaciones (bitácora
 * inmutable), una novedad tiene estado: abierta hasta que se resuelve.
 *
 * user_id / resuelta_por nullOnDelete: eliminar un usuario no borra ni
 * bloquea el historial de novedades.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('novedades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipo_id')->constrained('equipos')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('descripcion');
            $table->string('estado', 20)->default('abierta')->index();
            $table->text('nota_resolucion')->nullable();
            $table->foreignId('resuelta_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resuelta_en')->nullable();
            $table->timestamps();

            // El indicador de Equipos cuenta novedades abiertas por equipo.
            $table->index(['equipo_id', 'estado']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('novedades');
    }
};