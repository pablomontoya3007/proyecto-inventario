<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auditorias', function (Blueprint $table) {
            $table->id();

            // nullOnDelete: si el usuario que hizo el cambio se elimina más
            // adelante, el registro histórico se conserva — no tendría
            // sentido perder la auditoría solo porque alguien ya no tiene
            // cuenta en el sistema.
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('accion', 20); // creado | actualizado | eliminado
            $table->morphs('auditable'); // auditable_type + auditable_id, con índice

            $table->json('cambios')->nullable();

            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auditorias');
    }
};
