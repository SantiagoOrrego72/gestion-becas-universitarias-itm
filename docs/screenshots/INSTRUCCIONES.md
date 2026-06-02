# Instrucciones para tomar las capturas del MVP

Ejecutar `start.bat` y tomar cada captura en el orden indicado.

## Pasos previos
1. Abrir `http://localhost:5173` en Chrome o Edge.
2. Activar zoom al 100% (Ctrl+0).
3. Usar la extensión "Full Page Screen Capture" o la tecla `F12 > ⋮ > Capture screenshot` de DevTools para captura completa.

## Lista de capturas requeridas

| Archivo | Instrucción |
|---------|-------------|
| `01_login.png` | Pantalla de login vacía (sin datos) |
| `02_registro.png` | Formulario de registro completado correctamente |
| `03_registro_error.png` | Intentar registrar con correo `@gmail.com` → mostrar el error de validación |
| `04_dashboard_estudiante.png` | Login como `estudiante@itm.edu` / `Est1234` → capturar dashboard |
| `05_convocatorias.png` | Sección `/convocatorias` con las tarjetas de convocatorias activas |
| `06_postulacion.png` | Modal/formulario de postulación abierto con carta de motivación escrita |
| `07_postulacion_duplicada.png` | Intentar postular a la misma convocatoria → mostrar error 409 |
| `08_documentos.png` | Sección `/documentos` con al menos un documento subido |
| `09_doc_tipo_invalido.png` | Intentar subir un archivo `.txt` → mostrar error de tipo |
| `10_solicitudes_estudiante.png` | Sección `/solicitudes` con la solicitud en estado EN_REVISION |
| `11_notificaciones.png` | Panel de notificaciones abierto con las notificaciones recibidas |
| `12_dashboard_evaluador.png` | Login como `evaluador@itm.edu` / `Eval1234` → capturar dashboard |
| `13_evaluacion.png` | Modal de evaluación con puntaje y observación completados |
| `14_dashboard_admin.png` | Login como `admin@itm.edu` / `Admin1234` → capturar dashboard |
| `15_ranking.png` | Sección `/ranking` con la tabla de solicitudes evaluadas |
| `16_desembolsos.png` | Login como `tesoreria@itm.edu` / `Tes1234` → sección `/desembolsos` |
| `17_txn_duplicada.png` | Intentar confirmar con el mismo N° de transacción → mostrar error 409 |
| `18_bloqueo_login.png` | Intentar login 3 veces con contraseña incorrecta → mostrar mensaje de bloqueo |
