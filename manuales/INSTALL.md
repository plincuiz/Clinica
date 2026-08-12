# Manual de Instalación y Despliegue — Sistema de Gestión Clínica

## Consideraciones previas
- PC "servidor": Linux recomendada (o Windows con Node.js LTS).
- Archivos críticos: .env (secretos) y prisma/dev.db (base de datos). No publicarlos ni perderlos.
- Usuario inicial: DNI 99999999 / Cambiar123! → cambiarla al entrar.
- El sistema corre en el puerto 3000.
- Ver tu IP de red: hostname -I  (ejemplo: 192.168.1.51).

---

## OPCIÓN 1 — Red local (las otras PCs no instalan nada)
Tu PC es el servidor; el resto usa solo el navegador.

1) cd ~/clinica
2) npm run build
3) nohup npm run start > clinica.log 2>&1 &
4) Desde cualquier PC de la red: http://TU_IP:3000
5) Si no conecta, abrir el puerto:
   sudo firewall-cmd --add-port=3000/tcp --permanent && sudo firewall-cmd --reload
   (o con ufw: sudo ufw allow 3000)
6) Detener: pkill -f "next start"

Ventaja: cero instalación en las otras PCs.
Limitación: la PC servidor debe quedar encendida.

---

## OPCIÓN 2 — Paquete portable (tar + setup.sh)

### Generar el paquete (en la PC de trabajo)
Con datos incluidos:
  cd ~
  tar --exclude='clinica/node_modules' --exclude='clinica/.next' -czf clinica-portable.tar.gz clinica

Versión genérica (sin datos): borrar antes prisma/dev.db y .env, o agregar
--exclude='clinica/prisma/dev.db' --exclude='clinica/.env' al tar.

### Instalar en otra PC con Linux
1) Instalar Node.js:
   Manjaro: sudo pacman -S nodejs npm
   Ubuntu/Debian: sudo apt install nodejs npm
2) Copiar clinica-portable.tar.gz (USB o red) y descomprimir:
   tar -xzf clinica-portable.tar.gz
3) cd clinica
4) ./setup.sh
   (instala dependencias, crea .env si falta, crea la base, carga seeds y compila)
5) npm run start → http://localhost:3000 (o http://TU_IP:3000 desde otras PCs)

### Instalar en Windows
1) Instalar Node.js LTS desde nodejs.org.
2) Descomprimir el paquete (7-Zip).
3) En PowerShell, dentro de la carpeta:
   npm install
   npx prisma db push
   npx tsx prisma/seed.ts
   npx tsx prisma/seed-insurer.ts
   npx tsx prisma/seed-specialties.ts
   npm run build
   npm run start
   Si no existe .env, crearlo a mano con:
     DATABASE_URL="file:./dev.db"
     AUTH_SECRET=(cualquier texto largo al azar)

### GitHub (versionado opcional)
1) Crear repositorio PRIVADO "clinica" en github.com.
2) En la PC de trabajo:
   cd ~/clinica
   git init
   git add .
   git commit -m "Sistema de gestion clinica v1"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/clinica.git
   git push -u origin main
3) En otra PC: git clone https://github.com/TU_USUARIO/clinica.git && cd clinica && ./setup.sh
Nota: .env y dev.db quedan fuera del repo por .gitignore.

---

## OPCIÓN 3 — Docker (instalación de un comando)
1) Instalar Docker en la máquina destino:
   sudo pacman -S docker
   sudo systemctl enable --now docker
2) Llevar la carpeta del proyecto (o clonarla de GitHub).
3) Dentro de la carpeta:
   docker compose up -d
4) Entrar a http://localhost:3000 (o http://TU_IP:3000).
5) Ver logs: docker compose logs -f
6) Detener: docker compose down
7) Backup del volumen de datos:
   docker run --rm -v clinica_datos:/data -v $PWD:/backup alpine \
     tar czf /backup/clinica-datos.tar.gz -C /data .

Si no tenés Dockerfile y docker-compose.yml, crearlos según el Apéndice B.

---

## Backup y restauración (todas las opciones)
- La base es el archivo prisma/dev.db.
- Backup manual: ~/clinica/backup.sh (también copia .env).
- Automático: cron diario 2 AM (ver crontab -l).
- Restaurar: detener el sistema, reemplazar prisma/dev.db por el backup, reiniciar.

## Problemas frecuentes
- Puerto ocupado: pkill -f "next start" y reintentar.
- "Falta AUTH_SECRET": falta .env → correr ./setup.sh o crearlo a mano.
- Contraseña olvidada: un administrador la cambia en Usuarios → Editar.
- Otra PC no conecta: revisar firewall (Opción 1, paso 5) y que estén en la misma red.

---

## APÉNDICE A — contenido de setup.sh
#!/bin/bash
set -e
cd "$(dirname "$0")"
echo "== Instalación del Sistema Clínico =="
command -v node >/dev/null 2>&1 || { echo "Primero instalá Node.js"; exit 1; }
npm install
if [ ! -f .env ]; then
  {
    echo 'DATABASE_URL="file:./dev.db"'
    echo "AUTH_SECRET=$(openssl rand -hex 32)"
  } > .env
  echo ".env creado"
fi
npx prisma db push
npx tsx prisma/seed.ts
npx tsx prisma/seed-insurer.ts
npx tsx prisma/seed-specialties.ts
npm run build
echo "Instalación lista. Iniciá con: npm run start"

## APÉNDICE B — Dockerfile y docker-compose.yml
Dockerfile:
  FROM node:22-alpine
  WORKDIR /app
  COPY . .
  RUN npm install && npx prisma generate && npm run build
  EXPOSE 3000
  CMD ["sh", "-c", "npx prisma db push && npx tsx prisma/seed.ts && npx tsx prisma/seed-insurer.ts && npx tsx prisma/seed-specialties.ts && npm run start"]

docker-compose.yml:
  services:
    clinica:
      build: .
      ports:
        - "3000:3000"
      volumes:
        - datos:/app/prisma
      environment:
        AUTH_SECRET: "cambiar-este-secreto-largo"
        DATABASE_URL: "file:./dev.db"
  volumes:
    datos:
