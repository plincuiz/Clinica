# Manual: Configurar el correo para enviar recetas

## ¿Para qué sirve?
Para que el sistema pueda enviar recetas por email al paciente
(o a quien vos indiques) con un solo clic.

## ¿Qué necesitás antes de empezar?
- El sistema instalado y funcionando.
- Una cuenta de Gmail (recomendado) para la clínica.
- 10 minutos de tiempo.

---

## PARTE 1 — Preparar la cuenta de Gmail

### Paso 1: Activar la verificación en 2 pasos
1. Abrir el navegador y entrar a: myaccount.google.com
2. Iniciar sesión con la cuenta de la clínica.
3. En el menú de la izquierda, hacer click en "Seguridad".
4. Buscar "Verificación en dos pasos" y entrar.
5. Seguir los pasos (pide tu teléfono y un código).
6. Al terminar debe decir "Activado".

### Paso 2: Crear la "contraseña de aplicación"
1. Todavía en "Seguridad", buscar "Contraseñas de aplicaciones".
   Si no aparece, entrar directo a: myaccount.google.com/apppasswords
2. En "Nombre de la app" escribir: Sistema Clinica
3. Hacer click en "Crear".
4. Aparece un cartel amarillo con un código de 16 letras
   (ejemplo: abcd efgh ijkl mnop).
5. Anotar ese código o dejar la pestaña abierta.
   Esa es la "llave" que va a usar el sistema (NO la contraseña normal).

---

## PARTE 2 — Cargar los datos en el sistema

Hay que editar un archivo de configuración llamado .env
que está dentro de la carpeta del sistema (clinica).

### En Linux
1. Abrir una terminal en la carpeta del sistema.
2. Escribir:  nano .env  y presionar Enter.
3. Buscar las líneas que empiezan con EMAIL_.
4. Dejarlas así (con tus datos):

    EMAIL_HOST=smtp.gmail.com
    EMAIL_PORT=587
    EMAIL_USER=laclinica@gmail.com
    EMAIL_PASS=abcdefghijklmnop
    EMAIL_FROM=Sistema Clinica

   IMPORTANTE: en EMAIL_PASS va el código de 16 letras
   TODO JUNTO, sin espacios.
5. Guardar con Ctrl + O, Enter, y salir con Ctrl + X.
6. Reiniciar el sistema (Ctrl + C y después npm run start).

### En Windows
1. Abrir la carpeta clinica en el Explorador.
2. Si no ves el archivo .env: pestaña "Vista" → tildar
   "Elementos ocultos".
3. Click derecho sobre .env → "Abrir con" → "Bloc de notas".
4. Editar las mismas líneas EMAIL_ con tus datos.
5. Guardar (Ctrl + G) y cerrar.
6. Reiniciar el sistema.

---

## PARTE 3 — Probar que funciona

1. Entrar al sistema como médico.
2. Abrir una consulta que tenga una receta emitida.
3. Hacer click en "Enviar por email".
4. Escribir tu propio email y aceptar.
5. En menos de 1 minuto debe llegarte el correo con la receta.

---

## Si algo falla

"El envío de correo no está configurado"
→ Falta completar el .env o quedó el texto "poner-aqui-la-clave".
  Revisar las líneas EMAIL_ y reiniciar el sistema.

"No se pudo enviar el correo"
→ Verificar que:
  - EMAIL_USER sea la dirección completa de Gmail.
  - EMAIL_PASS sea el código de 16 letras sin espacios.
  - La verificación en 2 pasos esté activada.

¿Usás otro correo que no es Gmail?
→ Cambiar solo EMAIL_HOST:
  - Outlook/Hotmail: smtp.office365.com (puerto 587)
  - Correo propio del dominio: pedir al proveedor el "servidor SMTP".

---

## Notas importantes
- Usar una cuenta de la clínica, no una personal.
- No compartir el archivo .env: contiene la llave del correo.
- El sistema solo ENVÍA correos (recetas); nunca lee la bandeja.
- Si cambiás la contraseña de la cuenta de Google,
  hay que crear una nueva contraseña de aplicación y actualizar el .env.
