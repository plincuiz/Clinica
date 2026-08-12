# Guía de Instalación del Sistema Clínico en Windows

Esta guía te permite instalar el sistema en una PC con Windows para que funcione como servidor, y que las demás PCs de la clínica accedan desde sus navegadores.

---

## QUÉ VAS A NECESITAR

1. **PC Servidor** (Windows 10 u 11): donde se instala el sistema.
2. **PCs Clientes**: las demás PCs de la clínica (solo necesitan navegador web).
3. **Conexión de red**: todas las PCs conectadas a la misma red (WiFi o cable).
4. **El archivo portable**: `clinica-portable.tar.gz` (te lo paso yo).

---

## PASO 1: Preparar la PC Servidor

### 1.1 Instalar Node.js

1. Abrir el navegador (Chrome, Edge, Firefox).
2. Ir a: **https://nodejs.org**
3. Hacer click en el botón verde grande que dice **"LTS"** (es la versión estable).
4. Se descarga un archivo llamado algo como `node-v22.x.x-x64.msi`.
5. Hacer doble click en ese archivo para instalar.
6. En el instalador, hacer click en **Next** varias veces, aceptando todo por defecto.
7. Al final, hacer click en **Finish**.

### 1.2 Instalar 7-Zip (para descomprimir)

1. Ir a: **https://www.7-zip.org**
2. Descargar la versión para tu Windows (generalmente "64-bit x64").
3. Instalar haciendo doble click y aceptando todo.

---

## PASO 2: Copiar el Sistema a la PC Servidor

### 2.1 Obtener el archivo portable

El archivo `clinica-portable.tar.gz` contiene todo el sistema. Copialo a la PC Servidor usando:
- Un pendrive USB, o
- Enviándolo por email, o
- Copiándolo por la red.

### 2.2 Descomprimir el archivo

1. Buscar el archivo `clinica-portable.tar.gz` en la PC Servidor.
2. Hacer click derecho sobre el archivo.
3. Elegir **7-Zip → Extraer aquí** (o "Extract Here").
4. Esperar unos segundos. Se crea una carpeta llamada `clinica`.
5. Mover esa carpeta `clinica` a una ubicación fácil, por ejemplo: `C:\clinica`

---

## PASO 3: Instalar el Sistema

### 3.1 Abrir PowerShell

1. Presionar la tecla **Windows** en el teclado.
2. Escribir: **PowerShell**
3. Hacer click en **Windows PowerShell** (no necesita ser "Administrador").

### 3.2 Ir a la carpeta del sistema

En la ventana azul de PowerShell, escribir:

    cd C:\clinica

Y presionar **Enter**.

### 3.3 Ejecutar la instalación

Copiar y pegar estos comandos **uno por uno**, presionando **Enter** después de cada uno:

    npm install

Esperar a que termine (puede tardar 1-2 minutos).

    npx prisma db push

Esperar a que termine.

    npx tsx prisma/seed.ts

Esperar a que termine. Debe decir "Usuario admin creado".

    npx tsx prisma/seed-insurer.ts

Esperar a que termine.

    npx tsx prisma/seed-specialties.ts

Esperar a que termine.

    npm run build

Esperar a que termine (puede tardar 1-2 minutos).

---

## PASO 4: Crear el Archivo de Configuración

### 4.1 Crear el archivo .env

En la misma ventana de PowerShell, escribir:

    notepad .env

Y presionar **Enter**. Se abre el Bloc de Notas.

### 4.2 Pegar el contenido

Copiar y pegar exactamente esto en el Bloc de Notas:

    DATABASE_URL="file:./dev.db"
    AUTH_SECRET="este-es-un-secreto-muy-largo-que-puedo-inventar-cualquier-texto-largo-aqui"

**Importante:** donde dice "este-es-un-secreto-muy-largo...", podés poner cualquier texto largo al azar (letras y números). Es como una contraseña maestra del sistema.

### 4.3 Guardar y cerrar

1. En el Bloc de Notas: **Archivo → Guardar**
2. Cerrar el Bloc de Notas.

---

## PASO 5: Encender el Sistema

### 5.1 Iniciar el servidor

En PowerShell (todavía en `C:\clinica`), escribir:

    npm run start

Y presionar **Enter**.

Después de unos segundos, debe aparecer algo como:

    Local:   http://localhost:3000
    Network: http://192.168.1.XX:3000

**¡El sistema está encendido!** No cerrar esta ventana de PowerShell. Dejarla abierta mientras se use el sistema.

### 5.2 Averiguar la IP de la PC Servidor

Abrir **otra** ventana de PowerShell (sin cerrar la primera):

1. Presionar tecla **Windows**.
2. Escribir **PowerShell** y abrir otra ventana.
3. Escribir:

    ipconfig

4. Buscar donde dice **"Dirección IPv4"**. Va a ser algo como `192.168.1.51` o `192.168.0.10`.
5. **Anotar ese número** (la IP).

---

## PASO 6: Probar desde la PC Servidor

1. Abrir el navegador (Chrome, Edge, Firefox).
2. En la barra de direcciones escribir:

    http://localhost:3000

3. Debe aparecer la pantalla de login del sistema.
4. Entrar con:
   - **DNI:** 99999999
   - **Contraseña:** Cambiar123!

Si entra correctamente, ¡el sistema funciona!

**IMPORTANTE:** Cambiar la contraseña inmediatamente:
1. Ir al menú **Usuarios**.
2. Buscar el usuario con DNI 99999999.
3. Hacer click en **Editar**.
4. Poner una nueva contraseña segura.
5. Guardar.

---

## PASO 7: Acceder desde las Otras PCs (Clientes)

### 7.1 En cada PC Cliente

1. Abrir el navegador (Chrome, Edge, Firefox).
2. En la barra de direcciones escribir:

    http://LA_IP_ANOTADA:3000

   Por ejemplo, si la IP era `192.168.1.51`, escribir:

    http://192.168.1.51:3000

3. Debe aparecer la misma pantalla de login.
4. Entrar con el usuario y contraseña que crearon.

### 7.2 Si no conecta desde las otras PCs

Probar estas soluciones en la PC Servidor:

**Solución A: Desactivar el firewall temporalmente**

1. En la PC Servidor, abrir **Panel de Control**.
2. Ir a **Sistema y seguridad → Firewall de Windows Defender**.
3. Click en **Activar o desactivar el firewall de Windows Defender**.
4. Marcar **Desactivar** en ambas opciones.
5. Aceptar.
6. Probar de nuevo desde las otras PCs.

**Solución B: Permitir el puerto 3000 en el firewall**

Si no querés desactivar el firewall:

1. Abrir PowerShell como **Administrador** (click derecho → Ejecutar como administrador).
2. Escribir:

    netsh advfirewall firewall add rule name="Clinica Puerto 3000" dir=in action=allow protocol=TCP localport=3000

3. Presionar Enter.
4. Probar de nuevo desde las otras PCs.

---

## PASO 8: Uso Diario

### Para encender el sistema cada día

1. En la PC Servidor, abrir PowerShell.
2. Escribir:

    cd C:\clinica
    npm run start

3. Dejar la ventana abierta todo el día.

### Para apagar el sistema

En la ventana de PowerShell donde está corriendo, presionar:

    Ctrl + C

### Para crear usuarios

1. Entrar al sistema como administrador.
2. Ir al menú **Usuarios**.
3. Click en **+ Nuevo Usuario**.
4. Crear usuarios para:
   - Recepción/Secretaría
   - Médicos
   - Otros administradores

---

## PROBLEMAS COMUNES

### "La página no carga desde otras PCs"
- Verificar que todas las PCs estén en la misma red WiFi/cable.
- Verificar la IP correcta con `ipconfig`.
- Desactivar el firewall temporalmente (Solución A arriba).

### "PowerShell no reconoce npm"
- Node.js no se instaló correctamente.
- Reiniciar la PC y probar de nuevo.

### "Se cerró PowerShell y el sistema se apagó"
- Es normal. El sistema solo funciona mientras PowerShell esté abierto.
- Volver a encender con `npm run start`.

### "Olvidé la contraseña de un usuario"
- Entrar con otro usuario administrador.
- Ir a **Usuarios → Editar** el usuario olvidado.
- Poner una nueva contraseña.

---

## BACKUPS (Copias de Seguridad)

### Hacer backup manual

1. Cerrar el sistema (Ctrl + C en PowerShell).
2. Copiar la carpeta `C:\clinica\prisma` a un pendrive o disco externo.
3. El archivo `dev.db` contiene todos los datos.

### Restaurar desde backup

1. Cerrar el sistema.
2. Reemplazar `C:\clinica\prisma\dev.db` con el archivo del backup.
3. Encender el sistema de nuevo.

---

## ACTUALIZACIONES

Cuando haya una versión nueva del sistema:

1. Cerrar el sistema en la PC Servidor.
2. Copiar la nueva carpeta `clinica` (sin borrar `prisma/dev.db`).
3. Abrir PowerShell en la carpeta.
4. Ejecutar:

    npm install
    npm run build
    npm run start

---

## RESUMEN PARA EL CLIENTE

**Instalación (se hace una sola vez):**
1. Instalar Node.js desde nodejs.org
2. Descomprimir el sistema
3. Ejecutar 5 comandos en PowerShell
4. Crear el archivo .env
5. Encender con `npm run start`

**Uso diario:**
1. Encender la PC Servidor.
2. Abrir PowerShell y ejecutar `npm run start`.
3. Desde cualquier PC de la red, entrar a `http://IP:3000`.
4. Al terminar el día, cerrar con Ctrl + C.

**Costo:** $0 (todo el software es gratuito).

**Mantenimiento:** Hacer backup semanal de la carpeta `prisma`.
