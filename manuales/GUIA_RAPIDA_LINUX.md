# Guía Rápida — Sistema Clínico en Linux (Manjaro, Mint, Debian)

## Paso 1 — Copiar el ZIP
Copiar clinica-portable.zip a la PC (pendrive o red).

## Paso 2 — Descomprimir
Click derecho sobre el ZIP → "Extraer aquí".
Queda una carpeta llamada "clinica".

## Paso 3 — Instalar (una sola vez)
1. Entrar a la carpeta clinica.
2. Click derecho en un espacio vacío de la carpeta →
   "Abrir en terminal" / "Open in Terminal" / "Abrir terminal aquí".
3. Escribir:

    ./INSTALAR.sh

4. Si pide contraseña de usuario, escribirla (no se ve al teclear) y Enter.
5. Esperar a que termine. Instala todo solo (incluso Node.js si falta).

## Paso 4 — Encender (todos los días)
En la misma terminal:

    ./INICIAR.sh

Dejar la ventana abierta todo el día.
La pantalla muestra las direcciones de acceso, incluida tu IP.

## Paso 5 — Usar
- En esta PC: http://localhost:3000
- En las otras PCs de la red: http://LA_IP:3000
  (la IP la muestra INICIAR.sh al arrancar)

Usuario inicial: DNI 99999999 / Contraseña Cambiar123!
Cambiar la contraseña apenas entren (menú Usuarios → Editar).

Para apagar: Ctrl + C o cerrar la ventana.

## Si otras PCs no conectan (firewall)
Manjaro generalmente no bloquea. En Mint/Debian con ufw:

    sudo ufw allow 3000/tcp

## Si falla por versión vieja de Node (Debian)
Si el paso de "npm run build" da error de versión de Node:
1. En Debian/Mint, instalar Node más nuevo con NodeSource:

    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt install -y nodejs

2. Volver a ejecutar ./INSTALAR.sh

En Manjaro esto no pasa: su Node siempre es reciente.

## Backup
Con el sistema apagado, copiar la carpeta clinica/prisma a un pendrive.
El archivo dev.db contiene todos los datos.
