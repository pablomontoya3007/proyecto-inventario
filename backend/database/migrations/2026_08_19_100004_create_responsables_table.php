<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Catálogo de personas responsables/cuentadantes de equipos.
     * Independiente de la tabla users: un responsable no necesariamente
     * inicia sesión en el sistema.
     */
    public function up(): void
    {
        Schema::create('responsables', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 150);
            $table->string('documento', 30)->nullable()->unique();
            $table->string('cargo', 100)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('responsables');
    }
};
