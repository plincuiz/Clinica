# Manual de Node.js — Explicación y Uso

## ¿Qué es Node.js?
Es el "motor" que hace funcionar el sistema. Sin él, los archivos del sistema son como un libro cerrado: la PC no sabe cómo leerlos. Con Node.js instalado, la PC puede ejecutar el sistema y mostrarlo en el navegador.

Analogía: el sistema es una receta de cocina, Node.js es la cocina donde se prepara, y tu PC es la casa.

## ¿Qué hace en nuestro sistema?
- Muestra las pantallas (login, pacientes, turnos, etc.).
- Guarda y lee los datos (pacientes, médicos, consultas).
- Verifica contraseñas y permisos.
- Genera reportes y recetas.

## Comandos que vas a usar (sin programar)

Iniciar el sistema:

    cd ~/clinica
    npm run start

Detener el sistema: presionar Ctrl + C en la terminal donde corre.

Reiniciar después de cambios:

    npm run build
    npm run start

Instalar dependencias:

    npm install

## Instalación

### Linux (Manjaro)

    sudo pacman -S nodejs npm

### Linux (Ubuntu/Debian)

    sudo apt install nodejs npm

### Windows
1. Ir a nodejs.org
2. Descargar la versión LTS (botón verde).
3. Instalar aceptando todo.

### Verificar instalación

    node -v
    npm -v

Si muestra números de versión, está instalado.

## Archivos importantes
- package.json: lista de ingredientes del sistema.
- node_modules/: carpeta con esos ingredientes (se crea sola).
- .env: configuraciones privadas (no compartir).
- prisma/dev.db: la base de datos con todos los registros.

## Problemas frecuentes

"npm: orden no encontrada" → Node.js no está instalado. Instalarlo.

"Puerto 3000 ya en uso" → el sistema ya corre. Cerrarlo con Ctrl + C o:

    pkill -f "next start"

"Falta AUTH_SECRET" → falta el .env. Correr ./setup.sh

El sistema no arranca tras una actualización:

    cd ~/clinica
    rm -rf node_modules .next
    npm install
    npm run build
    npm run start

La PC se reinició y el sistema no arranca solo → Node.js no arranca solo; hay que encenderlo con npm run start.

## Resumen para el cliente
El sistema necesita Node.js instalado solo en la PC que actúa como servidor. Es gratuito, se instala una vez y no requiere mantenimiento. El sistema se enciende con un comando y se usa desde cualquier navegador de la red.
