<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('licencias_office', function (Blueprint $table) {
            $table->id();

            // unique() + constrained(): relación 1 a 1 real con equipos.
            $table->foreignId('equipo_id')
                ->unique()
                ->constrained('equipos')
                ->cascadeOnDelete();

            $table->string('correo', 150);
            $table->string('estado_licencia', 20)->default('activa');

            // TEXT y no VARCHAR: el cast "encrypted" de Laravel (AES-256-CBC)
            // produce una cadena base64 considerablemente más larga que la
            // contraseña original, y un VARCHAR corto la truncaría.
            // Este campo NUNCA se guarda ni se expone en texto plano.
            $table->text('password_cifrado');

            $table->date('fecha_actualizacion')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('licencias_office');
    }
};
