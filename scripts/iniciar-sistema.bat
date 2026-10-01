@echo off
REM ============================================================
REM  INICIAR SISTEMA - SPY Inventario de Equipos SENA
REM  Un clic para encender MySQL + Apache + Backend Laravel
REM ============================================================

REM --- CONFIGURACION: ajustar segun el equipo servidor ---
set XAMPP_DIR=C:\xampp
set BACKEND_DIR=C:\xampp\htdocs\proyecto-inventario\backend
set BACKEND_PORT=8000
REM ^ Si este mismo equipo tambien corre otro backend en el 8000,
REM   cambiar a 8001 aqui Y en frontend\.env.production.
set SERVER_IP=26.148.0.0
REM ^ IP del adaptador "Radmin VPN" (NO la de la LAN fisica del SENA).
REM   Si el servidor de SPY es otro equipo, verla con "ipconfig"
REM   en la seccion del adaptador Radmin VPN y reemplazarla.

title SPY Inventario - Encendiendo servicios
echo ==========================================
echo   Iniciando SPY - Inventario de Equipos SENA
echo ==========================================

REM mysql_start.bat y apache_start.bat usan rutas relativas internamente,
REM por eso hay que "pararse" dentro de C:\xampp antes de llamarlos.
cd /d "%XAMPP_DIR%"

echo.
echo [1/3] Iniciando MySQL...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>nul | find /I "mysqld.exe" >nul
if errorlevel 1 (
    start "MySQL - XAMPP" mysql_start.bat
    timeout /t 6 /nobreak >nul
) else (
    echo       MySQL ya estaba encendido, se reutiliza.
)

echo.
echo [2/3] Iniciando Apache...
tasklist /FI "IMAGENAME eq httpd.exe" 2>nul | find /I "httpd.exe" >nul
if errorlevel 1 (
    start "Apache - XAMPP" apache_start.bat
    timeout /t 4 /nobreak >nul
) else (
    echo       Apache ya estaba encendido, se reutiliza.
)

echo.
echo [3/3] Iniciando backend Laravel en el puerto %BACKEND_PORT%...
netstat -ano | find ":%BACKEND_PORT% " | find "LISTENING" >nul
if not errorlevel 1 (
    echo.
    echo [AVISO] El puerto %BACKEND_PORT% ya esta ocupado.
    echo         Puede ser otro backend, por ejemplo el de la cafeteria,
    echo         o una ventana anterior de este mismo sistema.
    echo         Cierra ese proceso o cambia BACKEND_PORT en este script.
    echo.
    pause
    exit /b 1
)
start "Backend Laravel - SPY Inventario" cmd /k "cd /d "%BACKEND_DIR%" && "%XAMPP_DIR%\php\php.exe" artisan serve --host=0.0.0.0 --port=%BACKEND_PORT%"

echo.
echo ==========================================
echo   Sistema listo. Deberian quedar abiertas
echo   las ventanas de MySQL, Apache y Backend Laravel.
echo   NO las cierres, solo minimizalas.
echo.
echo   Frontend:  http://%SERVER_IP%/proyecto-inventario-front
echo   Backend:   http://%SERVER_IP%:%BACKEND_PORT%/api
echo ==========================================
echo.
pause
