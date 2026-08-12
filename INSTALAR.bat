@echo off
title Instalador Sistema Clinico
cd /d "%~dp0"

echo ============================================
echo   INSTALADOR DEL SISTEMA CLINICO
echo ============================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo Node.js no esta instalado. Intentando instalarlo automaticamente...
  winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
  echo.
  echo Si la instalacion automatica funciono, CERRA esta ventana
  y volve a hacer doble click en INSTALAR.bat
  echo (Windows necesita reiniciar la consola para reconocer Node.js).
  echo Si dio error, instala Node.js manualmente desde https://nodejs.org
  pause
  exit /b 1
)

echo [1/5] Instalando componentes del sistema...
call npm install
if %errorlevel% neq 0 ( echo ERROR en paso 1. pause & exit /b 1 )

echo [2/5] Creando configuracion...
if not exist .env (
  echo DATABASE_URL="file:./dev.db"> .env
  echo AUTH_SECRET=clinica-%random%%random%%random%>> .env
  echo Archivo .env creado.
)

echo [3/5] Creando base de datos...
call npx prisma db push
if %errorlevel% neq 0 ( echo ERROR en paso 3. pause & exit /b 1 )

echo [4/5] Cargando datos iniciales...
call npx tsx prisma/seed.ts
call npx tsx prisma/seed-insurer.ts
call npx tsx prisma/seed-specialties.ts

echo [5/5] Preparando el sistema (puede tardar un par de minutos)...
call npm run build
if %errorlevel% neq 0 ( echo ERROR en paso 5. pause & exit /b 1 )

echo.
echo ============================================
echo   INSTALACION COMPLETADA
echo   Ahora hace doble click en INICIAR.bat
echo ============================================
pause
