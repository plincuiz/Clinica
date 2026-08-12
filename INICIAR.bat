@echo off
title SISTEMA CLINICO - SERVIDOR
cd /d "%~dp0"

echo ============================================
echo   SISTEMA CLINICO - SERVIDOR
echo   NO CIERRES esta ventana mientras se use.
echo ============================================
echo.
echo   En esta PC:        http://localhost:3000
echo   Desde otras PCs:   http://IP_DE_ESTA_PC:3000
echo.
echo   Para ver tu IP: abri otra consola y escribe  ipconfig
echo.
call npm run start
pause
