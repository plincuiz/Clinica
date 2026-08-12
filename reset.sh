#!/bin/bash
cd "$(dirname "$0")" || exit 1

echo "============================================"
echo "  BLANQUEO DE DATOS DEL SISTEMA"
echo "  Se borran TODOS los datos cargados."
echo "  Los backups anteriores NO se tocan."
echo "============================================"
read -p "¿Continuar? (s/N): " conf
[ "$conf" != "s" ] && echo "Cancelado." && exit 1

rm -f prisma/dev.db
rm -rf storage
mkdir -p storage

echo "Creando base vacía..."
npx prisma db push

echo "Creando usuario Super Admin..."
npx tsx prisma/seed.ts

read -p "¿Cargar también obras sociales y especialidades base? (s/N): " base
if [ "$base" = "s" ]; then
  npx tsx prisma/seed-insurer.ts
  npx tsx prisma/seed-specialties.ts
  echo "Base cargada con PARTICULAR y especialidades."
else
  echo "Base 100% vacía (solo Super Admin)."
fi

echo
echo "Listo. Iniciá con: npm run start (o npm run dev)"
echo "Usuario: 99999999 / Contraseña: Cambiar123!"
