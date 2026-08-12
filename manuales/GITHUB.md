# Manual de GitHub — Guía de Uso

## ¿Qué es GitHub?
Una "caja fuerte en la nube" donde guardás una copia del sistema. Si se rompe tu PC, recuperás todo desde GitHub.

Analogía: tu PC es tu casa; GitHub es la caja de seguridad del banco; cada cambio importante es una foto que mandás a la caja.

## Conceptos básicos
- Repositorio: la carpeta del proyecto en GitHub (se llama "clinica").
- Commit: sacar una foto del sistema en un momento.
- Push: subir las fotos a GitHub.
- Pull: bajar cambios desde GitHub.
- Clone: bajar el sistema por primera vez a una PC nueva.

## Crear cuenta
1. Ir a github.com y hacer Sign up.
2. Verificar el email.
3. Elegir el plan gratuito.

## Crear el repositorio
1. Click en "New repository".
2. Nombre: clinica
3. Marcar Private (muy importante).
4. Create repository.

## Subir el sistema por primera vez

    cd ~/clinica
    git init
    git add .
    git commit -m "Version inicial del sistema"
    git branch -M main
    git remote add origin https://github.com/TU_USUARIO/clinica.git
    git push -u origin main

## Personal Access Token (contraseña para comandos)
GitHub no acepta tu contraseña normal en la terminal. Crear un token:
1. Foto de perfil → Settings → Developer settings → Personal access tokens.
2. Generate new token.
3. Tildar permiso "repo".
4. Copiar el token y usarlo como contraseña cuando git lo pida.

## Comandos de uso diario

Guardar cambios (backup):

    cd ~/clinica
    git add .
    git commit -m "Descripcion del cambio"
    git push

Bajar cambios en otra PC:

    git pull

Instalar en PC nueva:

    git clone https://github.com/TU_USUARIO/clinica.git
    cd clinica
    ./setup.sh
    npm run start

Ver estado:

    git status

## Qué NO se sube a GitHub
El archivo .gitignore excluye:
- .env (contraseñas)
- prisma/dev.db (datos reales)
- node_modules/ y .next/ (temporales)

GitHub guarda el sistema, no los datos de pacientes.

## Recuperar el sistema si se pierde la PC
1. Instalar Node.js.
2. git clone ... y cd clinica
3. ./setup.sh
4. Copiar el último backup a prisma/dev.db
5. npm run start

## Alternativa sin terminal: GitHub Desktop
1. Descargar de desktop.github.com
2. Instalar e iniciar sesión.
3. Add existing repository → elegir ~/clinica
4. Escribir descripción → Commit → Push.

## Resumen para el cliente
GitHub es una copia de seguridad del sistema en la nube, privada y con acceso solo para el personal autorizado. Permite recuperar el sistema en minutos ante cualquier pérdida.
