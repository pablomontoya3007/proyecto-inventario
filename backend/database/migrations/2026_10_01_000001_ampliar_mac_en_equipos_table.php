<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * La MAC ya no exige el formato AA:BB:CC:DD:EE:FF (17 caracteres): la
 * institución maneja variaciones según el fabricante y el equipo. Se
 * amplía a 50 para que esas variaciones quepan sin provocar un error de
 * MySQL. El índice único se conserva (no se toca al cambiar la longitud).
 *
 * Desde Laravel 11, change() redefine la columna completa: por eso se
 * repite ->nullable(), o la columna quedaría NOT NULL.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('equipos', function (Blueprint $table) {
            $table->string('mac', 50)->nullable()->change();
            $table->string('mac_cableada', 50)->nullable()->change();
        });
    }

    /**
     * Ojo: si ya hay MAC de más de 17 caracteres guardadas, revertir esta
     * migración fallará (o las truncará, según el modo de MySQL).
     */
    public function down(): void
    {
        Schema::table('equipos', function (Blueprint $table) {
            $table->string('mac', 17)->nullable()->change();
            $table->string('mac_cableada', 17)->nullable()->change();
        });
    }
};