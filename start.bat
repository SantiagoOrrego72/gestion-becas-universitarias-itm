@echo off
chcp 65001 > nul
title Sistema de Becas - ITM

echo.
echo  ==========================================
echo   Sistema de Gestion de Becas Universitarias
echo   ITM - Instituto Tecnologico Metropolitano
echo   Stack: React + Vite  /  Node.js + PostgreSQL
echo  ==========================================
echo.

:: -- VERIFICAR PREREQUISITOS --

if not exist "%~dp0backend\node_modules" (
    echo [1/5] Instalando dependencias del backend...
    cd /d "%~dp0backend"
    call npm install
    echo.
)

if not exist "%~dp0frontend\node_modules" (
    echo [2/5] Instalando dependencias del frontend...
    cd /d "%~dp0frontend"
    call npm install
    echo.
)

:: -- PRISMA --

echo [3/5] Preparando base de datos...
cd /d "%~dp0backend"
call npx prisma generate
call npx prisma migrate deploy
echo.

:: -- BACKEND --

echo [4/5] Iniciando Backend en http://localhost:3000 ...
start "Backend - Becas ITM" cmd /k "cd /d "%~dp0backend" && node server.js"

:: Esperar que el backend levante antes de iniciar el frontend
timeout /t 3 > nul

:: -- FRONTEND --

echo [5/5] Iniciando Frontend en http://localhost:5173 ...
start "Frontend - Becas ITM" cmd /k "cd /d "%~dp0frontend" && npm run dev"

:: Esperar que Vite compile
timeout /t 4 > nul

:: Abrir el navegador
start http://localhost:5173

echo.
echo  ==========================================
echo   Aplicacion lista!
echo.
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:3000
echo   API      : http://localhost:3000/api/health
echo  ==========================================
echo.
echo  Credenciales de prueba:
echo    Estudiante : estudiante@itm.edu  /  Est1234
echo    Evaluador  : evaluador@itm.edu   /  Eval1234
echo    Admin      : admin@itm.edu       /  Admin1234
echo    Tesoreria  : tesoreria@itm.edu   /  Tes1234
echo.
echo  Cierra las ventanas de Backend y Frontend para detener.
echo.
pause
