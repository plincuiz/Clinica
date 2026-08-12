#!/bin/bash
cd "$(dirname "$0")" || exit 1
echo "============================================"
echo "  INSTALADOR DEL SISTEMA CLINICO (Linux)"
echo "============================================"
echo

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js no esta instalado. Intentando instalarlo..."
  if command -v pacman >/dev/null 2>&1; then
    sudo pacman -S --needed nodejs npm
  elif command -v apt >/dev/null 2>&1; then
    sudo apt update && sudo apt install -y nodejs npm
  else
    echo "No detecte el instalador de tu distribucion."
    echo "Instala Node.js manualmente y volve a ejecutar este script."
    read -p "Presiona Enter para salir"
    exit 1
  fi
fi

echo "[1/5] Instalando componentes del sistema..."
npm install || { echo "ERROR en paso 1"; read -p "Presiona Enter para salir"; exit 1; }

echo "[2/5] Creando configuracion..."
if [ ! -f .env ]; then
  {
    echo 'DATABASE_URL="file:./dev.db"'
    echo "AUTH_SECRET=clinica-$(openssl rand -hex 16)"
  } > .env
  echo "Archivo .env creado."
fi

echo "[3/5] Creando base de datos..."
npx prisma db push || { echo "ERROR en paso 3"; read -p "Presiona Enter para salir"; exit 1; }

echo "[4/5] Cargando datos iniciales..."
npx tsx prisma/seed.ts
npx tsx prisma/seed-insurer.ts
npx tsx prisma/seed-specialties.ts

echo "[5/5] Preparando el sistema (puede tardar un par de minutos)..."
npm run build || { echo "ERROR en paso 5"; read -p "Presiona Enter para salir"; exit 1; }

echo
echo "============================================"
echo "  INSTALACION COMPLETADA"
echo "  Ahora ejecuta ./INICIAR.sh"
echo "============================================"
read -p "Presiona Enter para salir"
