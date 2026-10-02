<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Historial de correos redactados desde el sistema. Se guarda un
     * registro por envío (no por destinatario): destinatarios es la
     * lista de direcciones a las que se mandó.
     *
     * user_id nullOnDelete: si el usuario que lo envió se elimina, el
     * historial se conserva (mismo criterio que auditorias).
     *
     * Se guarda también cuando el envío FALLA (estado "fallido" + error),
     * para que quede constancia y se pueda reintentar.
     */
    public function up(): void
    {
        Schema::create('correos_enviados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('asunto', 200);
            $table->text('cuerpo');
            $table->json('destinatarios');
            $table->string('estado', 20)->index(); // enviado | fallido
            $table->text('error')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('correos_enviados');
    }
};