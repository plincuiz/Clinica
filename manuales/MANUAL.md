# Manual de Uso — Sistema de Gestión Clínica

## 1. Ingreso
- Abrí el navegador en la dirección del servidor (ej.: http://192.168.1.51:3000).
- Entrá con tu DNI y contraseña.
- Tras 3 intentos fallidos la cuenta se bloquea 5 minutos.
- Cerrá con "Salir" al terminar.

## 2. Roles
- SUPER_ADMIN: todo, incluidos Usuarios y Obras Sociales.
- ADMIN: gestión operativa y usuarios; sin notas clínicas.
- SECRETARY: pacientes, turnos, sala, liquidación y reportes; sin historia clínica.
- DOCTOR: sala, consultas, historia clínica, recetas; edita contacto de pacientes.

## 3. Secretaría / Administración
### Pacientes
- Pacientes → + Nuevo Paciente: DNI, nombre, apellido, obra social (y plan), nro afiliado.
- Buscador por nombre/apellido/DNI. Editar o Dar de baja (conserva historia).
### Turnos
- Turnos → + Nuevo Turno: paciente, médico, fecha, hora, duración, prioridad por color
  (Rojo Urgencia, Verde Nueva Atención, Azul Control, Amarillo Derivación).
### Sala de espera
- Recepcionar: pasa a "en espera". Ausente/Cancelar cierran sin atención.
### Liquidación
- Los turnos finalizados generan pendientes de bono (naranja).
- Cargar nro orden/bono + monto → Listo → Liquidar → Pagado/Debitado.
### Reportes
- Tipo (Obra Social / Médico / General), período y filtros → Generar → Imprimir.
### Usuarios (Admin)
- Alta/edición/baja de secretarías, médicos y admins.
### Obras Sociales (Admin)
- Alta/edición/baja con CUIT y contacto; carga de planes.

## 4. Médico
- Sala de Espera: Atender (abre consulta) y Finalizar (cierra y genera liquidación).
- Consultas: evolución, diagnóstico y plan; "Observaciones" se autocompleta
  separado por comas y es el texto que sale en la historia impresa.
- Recetas: Emitir → link público válido 30 días → Ver/Imprimir.
- Pacientes → Historia: todas las atenciones + Imprimir Historia Clínica completa.

## 5. Backups
- Automático diario 2 AM en ~/backups_clinica (conserva últimos 14).
- Manual: ~/clinica/backup.sh
- Restaurar: detener sistema, reemplazar prisma/dev.db por el backup, reiniciar.

## 6. Buenas prácticas
- Cambiar contraseñas de fábrica al empezar.
- Cada persona con su usuario; no compartir cuentas.
- Cerrar sesión en PCs compartidas.
- Copiar backups a disco externo o nube semanalmente.
