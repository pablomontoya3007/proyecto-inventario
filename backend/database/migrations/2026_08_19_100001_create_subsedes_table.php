<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subsedes', function (Blueprint $table) {
            $table->id();
            // restrictOnDelete: protege a nivel de BD contra el borrado de una sede
            // que todavía tiene subsedes, incluso si alguien salta la capa de aplicación.
            $table->foreignId('sede_id')
                ->constrained('sedes')
                ->restrictOnDelete();
            $table->string('nombre', 150);
            $table->timestamps();
            $table->softDeletes();

            // El mismo nombre de subsede puede repetirse en sedes distintas,
            // pero no dos veces dentro de la misma sede.
            $table->unique(['sede_id', 'nombre']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subsedes');
    }
};
