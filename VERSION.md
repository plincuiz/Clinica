# Historial de versiones del paquete de instalación

## clinica-v1.zip (versión inicial)
- Sistema base: login, pacientes, médicos, turnos, sala de espera,
  consultas, recetas, liquidaciones y reportes.
- Instaladores automáticos (INSTALAR/INICIAR para Windows y Linux).

## clinica-v2.zip (versión actual)
Todo lo de v1, más:
- Refresco automático configurable (botón ⚙) en sala/turnos/liquidación.
- Nueva identidad visual: logo, login renovado, menú con botones,
  animaciones y Panel de Control con tarjetas.
- Agenda diaria con filtros y edición/cancelación de turnos.
- El médico puede cargar y tomar turnos (con control de superposición
  y turno adelantado).
- Orden de atención: pendientes arriba, atendidos abajo separados.
- Flujo del médico: Atender → carga → guardar/recetar → vuelve a sala.
- Estudios adjuntos (PDF/imágenes) con botón de subida mejorado.
- Envío de recetas por email (configurable en .env).
- Historia clínica por paciente, en hojas por médico, imprimible.
- Tarjeta "Historia Clínica" en el inicio del médico → listado de pacientes.
- Exportación de reportes a CSV/Excel.
- Script reset.sh para blanqueo de datos.
- Manuales completos en carpeta manuales/ (incluye configuración de email).
