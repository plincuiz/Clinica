# Manual de Docker — Explicación y Uso

## ¿Qué es Docker?
Es una "caja" que contiene el sistema completo con todo lo que necesita (Node.js, base de datos, configuraciones). En vez de instalar todo por separado, instalás Docker y la caja ya viene lista.

Analogía: sin Docker armás la cocina pieza por pieza; con Docker alquilás una cocina ya equipada.

## ¿Qué hace en nuestro sistema?
- Incluye Node.js (no hay que instalarlo aparte).
- Mantiene la base de datos funcionando.
- Aísla el sistema del resto de la PC.
- Facilita backups y actualizaciones.

## Comandos que vas a usar

Encender:

    cd ~/clinica
    docker compose up -d

Ver si funciona:

    docker compose ps

Ver mensajes (salir con Ctrl + C):

    docker compose logs -f

Apagar:

    docker compose down

Reiniciar:

    docker compose restart

## Instalación

### Linux (Manjaro)

    sudo pacman -S docker docker-compose
    sudo systemctl enable --now docker
    sudo usermod -aG docker $USER

Cerrar sesión y volver a entrar. Verificar:

    docker --version
    docker compose version

### Windows / Mac
1. Descargar Docker Desktop desde docker.com
2. Instalar y reiniciar.
3. Debe quedar el icono de ballena activo.

## Backups con Docker

Backup:

    docker run --rm -v clinica_datos:/data -v $PWD:/backup alpine tar czf /backup/backup-clinica.tar.gz -C /data .

Restaurar:

    docker run --rm -v clinica_datos:/data -v $PWD:/backup alpine tar xzf /backup/backup-clinica.tar.gz -C /data

## Problemas frecuentes

"docker: orden no encontrada" → no está instalado.

"permission denied" → en Linux: sudo usermod -aG docker $USER y cerrar sesión.

"Puerto 3000 ya en uso" → cambiar en docker-compose.yml a "3001:3000" y entrar a localhost:3001.

No arranca tras reiniciar la PC:

    sudo systemctl start docker
    cd ~/clinica
    docker compose up -d

## ¿Cuándo usar Docker?
- Cuando instalás el sistema en varias PCs.
- Cuando querés todo aislado y listo con un comando.
- Cuando la PC tiene buena memoria (4 GB o más).

## Resumen para el cliente
Docker empaqueta el sistema listo para usar. Se instala una vez y el sistema se enciende con un solo comando, quedando aislado del resto de la computadora.
