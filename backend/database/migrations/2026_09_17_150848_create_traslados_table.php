<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('traslados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipo_id')->constrained('equipos')->cascadeOnDelete();
            // Nullable + nullOnDelete en ambas, aunque a nivel de negocio
            // siempre se llenan al crear: así, si algún día se borra una
            // ubicación vieja, el registro histórico del traslado
            // sobrevive (con esa referencia en null) en vez de romperse.
            $table->foreignId('ubicacion_origen_id')->nullable()->constrained('ubicaciones_formacion')->nullOnDelete();
            $table->foreignId('ubicacion_destino_id')->nullable()->constrained('ubicaciones_formacion')->nullOnDelete();
            $table->date('fecha_traslado');
            $table->text('motivo')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('traslados');
    }
};