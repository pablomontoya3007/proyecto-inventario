<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipos', function (Blueprint $table) {
            $table->id();

            // Clave de negocio: única y obligatoria, pero NO es la PK técnica.
            $table->string('placa_sena', 30)->unique();
            $table->string('serial', 100)->unique();

            // Formato típico AA:BB:CC:DD:EE:FF (17 caracteres). Únicas pero
            // opcionales: no todos los tipos de equipo tienen interfaz de red,
            // y no siempre se conoce el dato al momento del registro.
            $table->string('mac', 17)->nullable()->unique();
            $table->string('mac_cableada', 17)->nullable()->unique();

            $table->string('hostname', 100)->nullable();

            $table->foreignId('tipo_equipo_id')
                ->constrained('tipos_equipo')
                ->restrictOnDelete();

            // Si se elimina el responsable, el equipo queda sin asignar
            // en vez de bloquear el borrado.
            $table->foreignId('responsable_id')
                ->nullable()
                ->constrained('responsables')
                ->nullOnDelete();

            $table->foreignId('ubicacion_formacion_id')
                ->constrained('ubicaciones_formacion')
                ->restrictOnDelete();

            // String + PHP enum a nivel de modelo, en vez de ENUM de base de
            // datos: agregar un estado nuevo no requerirá una migración.
            $table->string('estado', 20)->default('activo');

            // Características técnicas variables según el tipo de equipo
            // (procesador/RAM para un portátil, número de puertos para un
            // switch, etc.). La validación de forma vive en el Form Request,
            // no en el esquema.
            $table->json('caracteristicas_tecnicas')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('hostname');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipos');
    }
};
