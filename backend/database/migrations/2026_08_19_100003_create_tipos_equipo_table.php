<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Catálogo de tipos de equipo (portátil, escritorio, impresora, router, etc.).
     * Es una tabla, no un enum, para poder agregar tipos nuevos sin desplegar código.
     */
    public function up(): void
    {
        Schema::create('tipos_equipo', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100)->unique();
            // Permite "desactivar" un tipo sin eliminarlo (y sin romper los
            // equipos que ya lo usan), en vez de recurrir a soft delete aquí.
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tipos_equipo');
    }
};
