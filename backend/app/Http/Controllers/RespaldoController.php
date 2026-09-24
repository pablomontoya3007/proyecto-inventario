<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Process;
use Illuminate\Validation\Rules\File;

/**
 * Respaldo y restauración de la base de datos completa, vía los
 * ejecutables reales de MySQL (mysqldump / mysql) en vez de reconstruir
 * esa lógica en PHP — es la única forma de garantizar que un respaldo
 * generado aquí se pueda restaurar sin sorpresas (tipos de dato, JSON,
 * la columna cifrada de licencias, llaves foráneas: todo lo maneja
 * mysqldump solo).
 *
 * La contraseña de MySQL se pasa por variable de entorno (MYSQL_PWD),
 * no como argumento --password= en la línea de comandos — así no queda
 * visible en la lista de procesos del sistema mientras corre.
 *
 * Sin Policy dedicada: no hay un modelo Eloquent detrás de esto, así
 * que la protección es la misma que el resto del sistema — estar
 * autenticado (middleware auth:sanctum de la ruta).
 */
class RespaldoController extends Controller
{
    public function generar(): Response
    {
        $conexion = config('database.connections.mysql');
        $nombreArchivo = 'backup-inventario-'.now()->format('Y-m-d_H-i-s').'.sql';

        $resultado = $this->ejecutarMysqldump($conexion, ['--routines', '--triggers']);

        if (!$resultado->successful()) {
            abort(500, 'No se pudo generar el respaldo: '.$this->mensajeDeError($resultado->errorOutput()));
        }

        return response($resultado->output(), 200, [
            'Content-Type' => 'application/sql',
            'Content-Disposition' => 'attachment; filename="'.$nombreArchivo.'"',
        ]);
    }

    public function restaurar(Request $request): JsonResponse
    {
        $request->validate([
            'archivo' => ['required', File::types(['sql', 'txt'])->max(512000)], // 500 MB
        ]);

        $conexion = config('database.connections.mysql');
        $contenidoArchivo = file_get_contents($request->file('archivo')->getRealPath());

        // Respaldo de seguridad de la base ACTUAL antes de sobrescribir
        // nada. No detiene la restauración si falla (p. ej. disco
        // lleno) — solo queda registrado en el log; bloquear la
        // restauración por esto sería peor que el problema que
        // intenta prevenir.
        $this->generarRespaldoAutomatico($conexion);

        $resultado = Process::timeout(config('respaldos.timeout_segundos'))
            ->env($this->variablesDeEntorno($conexion))
            ->input($contenidoArchivo)
            ->run([
                config('respaldos.mysql_path'),
                '--host='.$conexion['host'],
                '--port='.$conexion['port'],
                '--user='.$conexion['username'],
                $conexion['database'],
            ]);

        if (!$resultado->successful()) {
            return response()->json([
                'mensaje' => 'No se pudo restaurar el respaldo: '.$this->mensajeDeError($resultado->errorOutput()),
            ], 500);
        }

        return response()->json(['mensaje' => 'Base de datos restaurada correctamente.']);
    }

    private function generarRespaldoAutomatico(array $conexion): void
    {
        $carpeta = config('respaldos.carpeta_respaldo_automatico');

        if (!is_dir($carpeta)) {
            mkdir($carpeta, 0755, true);
        }

        $resultado = $this->ejecutarMysqldump($conexion);

        if ($resultado->successful()) {
            $ruta = $carpeta.DIRECTORY_SEPARATOR.'antes-de-restaurar-'.now()->format('Y-m-d_H-i-s').'.sql';
            file_put_contents($ruta, $resultado->output());
        } else {
            logger()->warning('No se pudo generar el respaldo automático previo a una restauración.', [
                'error' => $resultado->errorOutput(),
            ]);
        }
    }

    private function ejecutarMysqldump(array $conexion, array $opcionesExtra = [])
    {
        return Process::timeout(config('respaldos.timeout_segundos'))
            ->env($this->variablesDeEntorno($conexion))
            ->run([
                config('respaldos.mysqldump_path'),
                '--host='.$conexion['host'],
                '--port='.$conexion['port'],
                '--user='.$conexion['username'],
                '--single-transaction',
                ...$opcionesExtra,
                $conexion['database'],
            ]);
    }

    /**
     * En Windows, un proceso hijo lanzado sin heredar ciertas variables
     * del sistema (sobre todo SystemRoot) puede fallar al inicializar
     * sockets TCP/IP con errores como "Can't create TCP/IP socket" —
     * aunque el mismo comando funcione perfecto ejecutado a mano en una
     * terminal. Por eso se parte SIEMPRE del entorno completo actual de
     * PHP (getenv()) y solo se agrega/sobreescribe MYSQL_PWD encima, en
     * vez de mandar un arreglo aislado que reemplace todo lo demás.
     *
     * Si no hay contraseña configurada (típico de XAMPP con "root" sin
     * clave, como en este proyecto), no se agrega MYSQL_PWD en absoluto
     * — para el cliente de MySQL, la variable "presente pero vacía" no
     * siempre se comporta igual que "no mandar contraseña".
     */
    private function variablesDeEntorno(array $conexion): array
    {
        $entorno = getenv();

        if ($conexion['password'] !== '') {
            $entorno['MYSQL_PWD'] = $conexion['password'];
        }

        return $entorno;
    }

    private function mensajeDeError(string $salidaError): string
    {
        if (str_contains($salidaError, 'not found') || str_contains($salidaError, 'no se reconoce')) {
            return 'No se encontró el ejecutable de MySQL. Revisa MYSQLDUMP_PATH/MYSQL_PATH en el .env — en XAMPP suele ser "C:\\xampp\\mysql\\bin\\mysqldump.exe" y "C:\\xampp\\mysql\\bin\\mysql.exe".';
        }

        return trim($salidaError) ?: 'Error desconocido.';
    }
}
