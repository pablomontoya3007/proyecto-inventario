<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Bitácora de observaciones por equipo. Se trata como un registro
     * histórico inmutable: solo se crean filas nuevas, nunca se editan.
     * Por eso no lleva updated_at, solo created_at (la "fecha" del requisito).
     */
    public function up(): void
    {
        Schema::create('observaciones', function (Blueprint $table) {
            $table->id();

            $table->foreignId('equipo_id')
                ->constrained('equipos')
                ->cascadeOnDelete();

            // Quién la registró. restrictOnDelete: no se puede borrar un
            // usuario que ya tiene observaciones registradas, para no perder
            // la trazabilidad de auditoría.
            $table->foreignId('user_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->text('descripcion');

            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('observaciones');
    }
};
