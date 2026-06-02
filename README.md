# Sistema de Gestión de Becas Universitarias

**Institución Universitaria ITM — Diseño de Sistemas de Información**

> Plataforma web full-stack para gestionar el ciclo completo de becas universitarias: convocatorias, postulaciones, evaluación, selección de beneficiarios y desembolso de pagos.

---

## Integrantes

| Nombre | Rol en el proyecto |
|--------|-------------------|
| Isabela Ocampo Hoyos | Desarrolladora |
| Juan José Vega Escobar | Desarrollador |
| Santiago Orrego Castaño | Desarrollador |
| David José Arrieta Barraza | Desarrollador |

---

## Tecnologías utilizadas

### Frontend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| React | 18.3 | SPA con componentes reutilizables |
| Vite | 5.4 | Bundler y servidor de desarrollo |
| TailwindCSS | 3.4 | Estilos y diseño responsivo |
| React Router | v6 | Navegación y rutas protegidas por rol |
| Axios | 1.7 | Cliente HTTP con interceptores JWT |

### Backend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Node.js | 18+ | Entorno de ejecución |
| Express.js | 4.19 | Framework REST API |
| JWT (jsonwebtoken) | 9.0 | Autenticación stateless |
| bcryptjs | 2.4 | Hash seguro de contraseñas |
| Prisma ORM | 5.22 | Acceso a base de datos con tipado |
| PostgreSQL | 14+ | Base de datos relacional |
| express-validator | 7.1 | Validación de entradas |
| Multer | 1.4 | Subida de archivos PDF/imágenes |
| Helmet | 7.1 | Headers de seguridad HTTP |
| Winston | 3.13 | Logging estructurado |

---

## Funcionalidades implementadas

### HU-01 — Registro de estudiante
- Validación de correo institucional (`.edu` o `.edu.co`)
- Contraseña con reglas: mínimo 8 caracteres, mayúscula, número y carácter especial
- Creación automática del perfil de estudiante vinculado al usuario

### HU-02 — Autenticación y seguridad
- Login con JWT (7 días de expiración)
- Bloqueo automático tras 3 intentos fallidos (15 minutos)
- Rate limiting general: 100 req/15 min en producción, desactivado en desarrollo

### HU-03 — Gestión de convocatorias (Administrador)
- Crear, editar y eliminar convocatorias
- Configurar monto, cupos, fechas, requisitos y documentos requeridos
- Cierre automático al vencer la fecha límite
- Restricción: no se puede eliminar si tiene postulaciones activas

### HU-04 — Postulación a becas (Estudiante)
- Ver convocatorias disponibles (estado ABIERTA)
- Aplicar con carta de motivación y documentos adjuntos (PDF, máx. 5 MB)
- Validación: solo una postulación por convocatoria
- Validación: documentos obligatorios requeridos antes de enviar
- Notificación automática al estudiante al recibir la solicitud

### HU-05 — Evaluación de solicitudes (Evaluador)
- Ver todas las solicitudes asignadas con documentos adjuntos
- Calificar de 0 a 100 puntos con observación obligatoria (mín. 10 caracteres)
- Regla: puntaje ≥ 60 → APROBADO; puntaje < 60 o acción "rechazar" → RECHAZADO
- Notificación automática al estudiante con resultado

### HU-06 — Selección de beneficiarios (Administrador)
- Ranking visual de solicitudes evaluadas ordenado por puntaje
- Selección manual de beneficiarios mediante checkboxes
- Confirmación masiva: crea registro de pago y notifica a seleccionados
- Control de cupos: no se puede seleccionar más del límite de la convocatoria

### HU-07 — Desembolso de pagos (Tesorero)
- Ver desembolsos pendientes y confirmar con número de transacción
- Registrar fecha real de pago y cuenta bancaria destino
- Genera comprobante imprimible en nueva ventana
- Historial completo de desembolsos con estados

### HU-08 — Notificaciones en tiempo real
- Contador de notificaciones no leídas en la barra superior
- Modal de notificaciones con lista de eventos recientes
- Marcado automático como leídas al abrir el panel

---

## Patrones de diseño GoF implementados

Todos los patrones se encuentran en `backend/src/patterns/`. A continuación se documenta cada uno con las clases implementadas, el problema resuelto, referencias de código y el punto de integración.

---

### 1. Strategy — `backend/src/patterns/evaluacion.strategy.js`

**Problema resuelto:** la lógica para determinar `APROBADO` o `RECHAZADO` cambia según la acción del evaluador. Sin Strategy habría un `if/else` en el service que viola Open/Closed.

**Participantes implementados:**

| Clase | Tipo | Descripción |
|-------|------|-------------|
| `EvaluacionStrategy` | Interfaz (clase base) | Define `determinarEstado(puntaje)` |
| `AprobarStrategy` | Concrete Strategy | `puntaje >= 60` → `APROBADO`; si no → `RECHAZADO` |
| `RechazarStrategy` | Concrete Strategy | Siempre devuelve `RECHAZADO` |
| `EvaluacionContext` | Context | Delega a la estrategia activa en tiempo de ejecución |
| `crearStrategy(accion)` | Factory helper | Instancia la strategy según `'aprobar'` o `'rechazar'` |

**Código relevante (`evaluacion.strategy.js` líneas 31–48):**
```js
class AprobarStrategy extends EvaluacionStrategy {
  constructor(umbral = 60) { super(); this.umbral = umbral; }
  determinarEstado(puntaje) {
    return puntaje >= this.umbral ? 'APROBADO' : 'RECHAZADO';
  }
}
class RechazarStrategy extends EvaluacionStrategy {
  determinarEstado(_puntaje) { return 'RECHAZADO'; }
}
```

**Integración (`evaluacion.service.js` líneas 23–24):**
```js
const context = new EvaluacionContext(crearStrategy(accion));
const estado  = context.ejecutar(puntaje);
```

---

### 2. Observer — `backend/src/patterns/estado.observer.js`

**Problema resuelto:** cuando cambia el estado de una solicitud, múltiples subsistemas deben reaccionar (notificaciones, auditoría) sin acoplarlos a la lógica de evaluación.

**Participantes implementados:**

| Clase | Tipo | Descripción |
|-------|------|-------------|
| `EstadoObserver` | Interfaz Observer | Define `actualizar(evento, payload)` |
| `NotificacionObserver` | Concrete Observer | Persiste notificación en la BD |
| `AuditoriaObserver` | Concrete Observer | Registra la acción en la tabla de auditoría |
| `EstadoSubject` | Subject | Mantiene la lista de observers y los notifica |
| `estadoSubject` | Singleton | Instancia lista con ambos observers suscritos |

**Eventos soportados:** `SOLICITUD_EN_REVISION`, `SOLICITUD_APROBADA`, `SOLICITUD_RECHAZADA`, `SOLICITUD_DESEMBOLSADA`, `DOCUMENTO_VERIFICADO`, `DOCUMENTO_RECHAZADO`.

**Código relevante (`estado.observer.js` líneas 86–112):**
```js
class EstadoSubject {
  async notificar(evento, payload) {
    for (const observer of this._observers) {
      try { await observer.actualizar(evento, payload); }
      catch (err) { /* Un observer fallido no detiene los demás */ }
    }
  }
}
// Singleton registrado al cargar el módulo:
estadoSubject.suscribir(new NotificacionObserver());
estadoSubject.suscribir(new AuditoriaObserver());
```

**Integración (`evaluacion.service.js` líneas 57–67):**
```js
const eventoEval = estado === 'APROBADO' ? 'SOLICITUD_APROBADA' : 'SOLICITUD_RECHAZADA';
await estadoSubject.notificar(eventoEval, {
  usuarioId: sol.estudiante.usuarioId, actorId: evaluadorId,
  convocatoriaNombre: sol.convocatoria.nombre, puntaje, ...
});
```

---

### 3. Factory Method — `backend/src/patterns/usuario.factory.js`

**Problema resuelto:** cada rol tiene datos adicionales distintos al crearse (`Estudiante` requiere programa + documento; los demás no). Factory Method delega la creación concreta a subclases.

**Participantes implementados:**

| Clase | Tipo | Descripción |
|-------|------|-------------|
| `UsuarioFactory` | Creator abstracto | Define `crearUsuario(data, hash)` y `_validarCorreoUnico()` |
| `EstudianteFactory` | Concrete Creator | Crea `Usuario` + `Estudiante` en transacción Prisma |
| `EvaluadorFactory` | Concrete Creator | Crea `Usuario` con rol EVALUADOR |
| `AdministradorFactory` | Concrete Creator | Crea `Usuario` con rol ADMINISTRADOR |
| `TesoreroFactory` | Concrete Creator | Crea `Usuario` con rol TESORERO |
| `crearUsuarioFactory(rol)` | Helper | Retorna la factory correcta según el rol |

**Código relevante (`usuario.factory.js` líneas 39–53):**
```js
class EstudianteFactory extends UsuarioFactory {
  async crearUsuario({ nombre, correo, programa, documento }, passwordHash) {
    await this._validarCorreoUnico(correo);
    const docExiste = await prisma.estudiante.findUnique({ where: { documento } });
    if (docExiste) throw { status: 409, message: 'Este documento ya está registrado' };
    return prisma.usuario.create({
      data: { correo, password: passwordHash, nombre, rol: 'ESTUDIANTE',
              estudiante: { create: { programa, documento } } },
      include: { estudiante: true },
    });
  }
}
```

**Integración (`auth.service.js` líneas 16–17):**
```js
const factory = crearUsuarioFactory(rol);
const usuario = await factory.crearUsuario({ nombre, correo, programa, documento }, hash);
```

---

### 4. Template Method — `backend/src/patterns/postulacion.template.js`

**Problema resuelto:** toda postulación debe seguir el mismo flujo de pasos en orden fijo; las subclases pueden personalizar pasos individuales sin alterar el algoritmo completo.

**Pasos del algoritmo (`postular()` líneas 23–40):**

```
1. obtenerEstudiante(usuarioId)        → 404 si no existe perfil
2. obtenerConvocatoria(convocatoriaId) → 404 si no existe
3. validarEstadoConvocatoria()         → 400 si no es ABIERTA
4. validarFechaVigencia()              → 400 si fechaFin < ahora
5. validarCuposDisponibles()           → 409 si cuposUsados >= cuposTotal
6. verificarDuplicado()                → 409 si ya postulado
7. crearSolicitud()                    → persiste en BD, estado EN_REVISION
8. notificar()                         → crea notificación en BD
9. registrarAuditoria()                → registra en tabla auditoria
```

**Subclase concreta (`PostulacionBecaImpl` líneas 116–125):** sobreescribe solo `crearSolicitud()` para incluir `monto` de la convocatoria en la respuesta al frontend.

**Integración (`solicitud.service.js` línea 80):**
```js
return postulacionTemplate.postular(convocatoriaId, cartaMotivacion, usuarioId);
```

---

### 5. Decorator — `backend/src/patterns/documento.decorator.js`

**Problema resuelto:** la validación de un documento necesita múltiples capas de reglas que deben componerse dinámicamente sin herencia rígida ni modificar el validador base.

**Cadena de decoradores (construida por `construirValidador()` líneas 116–123):**

```
PropietarioDecorator          ← valida que el estudiante sea propietario
  └─ TamanioDecorator         ← valida tamaño máximo 5 MB
       └─ TipoArchivoDecorator← valida MIME: pdf / jpeg / png / jpg
            └─ DocumentoValidatorBase  ← siempre pasa (base)
```

**Código relevante (`documento.decorator.js` líneas 57–67):**
```js
class TipoArchivoDecorator extends DocumentoDecorator {
  async validar(file, context) {
    if (!TIPOS_VALIDOS.includes(file.mimetype)) {
      throw { status: 400, message: `Tipo no permitido: ${file.mimetype}. Se aceptan: PDF, JPG, PNG.` };
    }
    return super.validar(file, context); // delega al siguiente en la cadena
  }
}
```

---

## Principios SOLID aplicados

| Principio | Descripción | Evidencia en el código |
|-----------|-------------|----------------------|
| **S** — Single Responsibility | Cada módulo tiene una única razón de cambio | `auth.controller.js` solo maneja HTTP; `auth.service.js` solo contiene lógica de negocio; `auth.validator.js` solo define reglas; `error.middleware.js` solo centraliza errores |
| **O** — Open/Closed | Abierto para extensión, cerrado para modificación | `EvaluacionStrategy`: agregar `EvaluarPorPromedioStrategy` no requiere cambiar `EvaluacionContext` ni `evaluacion.service.js`. `UsuarioFactory`: agregar un nuevo rol solo requiere una nueva subclase |
| **L** — Liskov Substitution | Las subclases son sustituibles por su tipo base | `AprobarStrategy` y `RechazarStrategy` son intercambiables en `EvaluacionContext.ejecutar()`. `PostulacionBecaImpl` puede usarse en cualquier lugar donde se espere `PostulacionTemplate` |
| **I** — Interface Segregation | Interfaces mínimas y específicas | `EstadoObserver` expone solo `actualizar(evento, payload)`. `DocumentoValidator` expone solo `validar(file, context)`. `EvaluacionStrategy` expone solo `determinarEstado(puntaje)` |
| **D** — Dependency Inversion | Depender de abstracciones, no de implementaciones | Los controllers dependen de servicios (módulos), no de Prisma directamente. Los services dependen de las clases abstractas exportadas (`EvaluacionStrategy`, `PostulacionTemplate`, `DocumentoValidator`) |

---

## Arquitectura del sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vite)                     │
│  Login  Register  Dashboard  Convocatorias  Solicitudes     │
│  Documentos  Perfil  Evaluación  Ranking  Desembolsos       │
│                    Axios + JWT Interceptors                  │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/JSON — Puerto 5173 → proxy → 3000
┌─────────────────────▼───────────────────────────────────────┐
│                    BACKEND (Express.js)                      │
│  Routes → Middleware (Auth JWT + Roles + Validación)        │
│        → Controllers (capa delgada)                         │
│        → Services (lógica de negocio)                       │
│        → Patterns (GoF: Strategy/Observer/Factory/Template/Decorator) │
│        → Prisma ORM                                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              PostgreSQL — Base de datos                      │
│  usuarios  estudiantes  convocatorias  solicitudes_beca     │
│  documentos  evaluaciones  pagos  notificaciones  auditoria │
└─────────────────────────────────────────────────────────────┘
```

---

## Estructura de carpetas

```
sistema-becas/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Modelos + enums PostgreSQL
│   │   ├── seed.js              # Datos de prueba
│   │   └── migrations/          # Migraciones versionadas
│   ├── src/
│   │   ├── config/
│   │   │   └── prisma.js        # Singleton PrismaClient
│   │   ├── controllers/         # Handlers HTTP (7 archivos)
│   │   ├── services/            # Lógica de negocio (7 archivos)
│   │   ├── routes/              # Definición de rutas (7 archivos)
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js    # Verificación JWT
│   │   │   ├── roles.middleware.js   # RBAC por rol
│   │   │   ├── upload.middleware.js  # Multer (PDF/imágenes)
│   │   │   ├── validate.middleware.js
│   │   │   └── error.middleware.js
│   │   ├── patterns/            # ← Patrones GoF implementados
│   │   │   ├── evaluacion.strategy.js
│   │   │   ├── estado.observer.js
│   │   │   ├── usuario.factory.js
│   │   │   ├── postulacion.template.js
│   │   │   └── documento.decorator.js
│   │   ├── validators/          # Reglas express-validator
│   │   └── utils/               # JWT, logger, response helpers
│   ├── uploads/                 # Documentos subidos
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   │   └── logo-itm.png         # Logo de la institución
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js         # Cliente Axios + interceptores
│   │   ├── context/
│   │   │   ├── AuthContext.jsx  # Estado de autenticación global
│   │   │   └── ToastContext.jsx # Notificaciones toast
│   │   ├── components/
│   │   │   ├── Layout.jsx       # Sidebar + topbar
│   │   │   ├── Modal.jsx        # Modal reutilizable
│   │   │   └── Badge.jsx        # Badges de estado
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── estudiante/      # Dashboard, Convocatorias, Documentos, Solicitudes, Perfil
│   │   │   ├── evaluador/       # Dashboard, Solicitudes
│   │   │   ├── admin/           # Dashboard, Ranking
│   │   │   └── tesoreria/       # Dashboard, Desembolsos
│   │   ├── utils/
│   │   │   └── helpers.js       # Formateo de fechas/monedas
│   │   ├── App.jsx              # Router + rutas protegidas
│   │   ├── main.jsx
│   │   └── index.css            # Variables CSS + componentes
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── start.bat                    # Script de inicio Windows
├── .gitignore
└── README.md
```

---

## Requisitos de instalación

- **Node.js** 18 o superior → https://nodejs.org
- **PostgreSQL** 14 o superior → https://www.postgresql.org/download/
- **npm** 9 o superior (incluido con Node.js)

---

## Pasos para ejecutar el proyecto

### 1. Clonar el repositorio
```bash
git clone <URL-del-repositorio>
cd "Gestión de becas universitarias"
```

### 2. Crear la base de datos
```sql
-- En psql o pgAdmin 4:
CREATE DATABASE becas_db;
```

### 3. Configurar variables de entorno
```bash
cd backend
copy .env.example .env
```
Editar `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/becas_db"
JWT_SECRET="cambia_esto_en_produccion_usa_32_caracteres_minimo"
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

### 4. Instalar dependencias y cargar datos
```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
node prisma/seed.js

# Frontend
cd ../frontend
npm install
```

### 5. Iniciar la aplicación

**Windows (recomendado):**
```
start.bat
```

**Manual (dos terminales):**
```bash
# Terminal 1 — Backend (puerto 3000)
cd backend
npm run dev

# Terminal 2 — Frontend (puerto 5173)
cd frontend
npm run dev
```

Abrir: **http://localhost:5173**

---

## Credenciales de prueba

| Rol | Correo | Contraseña |
|-----|--------|-----------|
| Estudiante | estudiante@itm.edu | Est1234 |
| Evaluador | evaluador@itm.edu | Eval1234 |
| Administrador | admin@itm.edu | Admin1234 |
| Tesorero | tesoreria@itm.edu | Tes1234 |

---

## Flujo principal (Happy Path)

```
1. Administrador crea convocatoria (monto, cupos, fechas, documentos requeridos)
        ↓
2. Estudiante se registra y aplica adjuntando documentos PDF
        ↓
3. Evaluador califica la solicitud (0-100) con observación
        ↓
4. Administrador selecciona beneficiarios desde el ranking
        ↓
5. Tesorero confirma desembolso con número de transacción
        ↓
6. Estudiante recibe notificación de pago y puede ver su comprobante
```

## Flujos alternativos implementados

| Situación | Comportamiento del sistema |
|-----------|--------------------------|
| Login con credenciales incorrectas | Contador de intentos; bloqueo a los 3 fallos (15 min) |
| Registro con correo no institucional | Error: "Solo se permiten correos .edu o .edu.co" |
| Postular a convocatoria cerrada | Error 400: "La convocatoria no está abierta" |
| Postular sin documentos obligatorios | Error en frontend antes de enviar |
| Postular dos veces a la misma beca | Error 409: "Ya has postulado a esta convocatoria" |
| Eliminar convocatoria con postulaciones | Error 409: "No se puede eliminar, tiene postulaciones" |
| Puntaje < 60 al evaluar | Estado = RECHAZADO automáticamente |
| Confirmar desembolso de solicitud no aprobada | Error 400: "Solo se pueden desembolsar solicitudes APROBADAS" |
| Número de transacción duplicado | Error 409: "El N° de transacción ya fue registrado" |
| Acceder a ruta sin token JWT | 401 Unauthorized |
| Acceder a ruta sin el rol correcto | 403 Forbidden |

---

## API REST — Endpoints principales

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| POST | `/api/auth/register` | Registrar estudiante | Público |
| POST | `/api/auth/login` | Iniciar sesión | Público |
| GET | `/api/auth/me` | Perfil del usuario autenticado | Todos |
| GET | `/api/convocatorias` | Listar convocatorias | Todos |
| POST | `/api/convocatorias` | Crear convocatoria | Admin |
| PUT | `/api/convocatorias/:id` | Editar convocatoria | Admin |
| DELETE | `/api/convocatorias/:id` | Eliminar convocatoria | Admin |
| GET | `/api/solicitudes` | Listar solicitudes (filtradas por rol) | Todos |
| POST | `/api/solicitudes` | Crear solicitud | Estudiante |
| POST | `/api/documentos/upload` | Subir documento | Estudiante |
| GET | `/api/documentos/:id/file` | Descargar documento | Autenticado |
| POST | `/api/evaluaciones/solicitud/:id` | Evaluar solicitud | Evaluador |
| GET | `/api/pagos` | Listar pagos | Tesorero/Admin |
| PUT | `/api/pagos/:id/confirmar` | Confirmar desembolso | Tesorero |
| GET | `/api/notificaciones` | Mis notificaciones | Todos |
| GET | `/api/health` | Estado del servidor | Público |

---

## Seguridad implementada

| Mecanismo | Descripción |
|-----------|-------------|
| JWT | Token firmado con expiración de 7 días |
| bcryptjs | 10 rounds de sal para hash de contraseñas |
| Rate limiting | 3 intentos de login por correo / 15 min |
| CORS | Solo acepta peticiones del frontend configurado |
| Helmet | Headers HTTP de seguridad (CSP, HSTS, etc.) |
| RBAC | Middleware de roles en cada ruta protegida |
| Validación backend | express-validator en todos los endpoints |
| Auditoría | Registro de todas las acciones críticas |

---

## Despliegue

> *(Completar con la URL si se despliega en un servicio como Railway, Render, Vercel, etc.)*

---

## Capturas del MVP

### Autenticación

![Login](screenshots/01_login.png)
*Pantalla de inicio de sesión — HU-02: autenticación JWT*

![Registro de estudiante](screenshots/02_registro.png)
*Registro con validación de correo institucional — HU-01: Factory Method*

![Error correo no institucional](screenshots/03_error_email_no_institucional.png)
*Validación: solo se permiten correos `.edu` o `.edu.co`*

---

### Estudiante

![Dashboard del estudiante](screenshots/04_estudiante_dashboard.png)
*Dashboard principal del estudiante — acceso por rol*

![Convocatorias disponibles](screenshots/05_estudiante_convocatorias.png)
*Listado de convocatorias con estado ABIERTA — HU-04*

![Detalle de convocatoria](screenshots/06_estudiante_detalle_convocatoria.png)
*Formulario de postulación — HU-03 (Template Method)*

![Carga de documentos](screenshots/07_estudiante_documentos.png)
*Subida de documentos PDF — HU-04 (Decorator: tipo, tamaño, propietario)*

![Mis solicitudes](screenshots/08_estudiante_solicitudes.png)
*Estado de las solicitudes enviadas — EN_REVISION / APROBADO / RECHAZADO*

![Perfil del estudiante](screenshots/09_estudiante_perfil.png)
*Información del perfil del estudiante*

![Notificaciones](screenshots/10_estudiante_notificaciones.png)
*Panel de notificaciones automáticas — HU-08 (Observer)*

---

### Evaluador

![Dashboard del evaluador](screenshots/11_evaluador_dashboard.png)
*Panel del evaluador con solicitudes asignadas — HU-05*

![Listado de solicitudes (evaluador)](screenshots/12_evaluador_solicitudes.png)
*Solicitudes pendientes de evaluación con documentos adjuntos*

![Formulario de evaluación](screenshots/13_evaluador_modal_evaluar.png)
*Calificación 0–100 con observación obligatoria — HU-05 (Strategy)*

---

### Administrador

![Dashboard del administrador](screenshots/14_admin_dashboard.png)
*Gestión de convocatorias — HU-03*

![Nueva convocatoria](screenshots/15_admin_nueva_convocatoria.png)
*Formulario de creación de convocatoria (monto, cupos, fechas, documentos)*

![Ranking de beneficiarios](screenshots/16_admin_ranking.png)
*Selección de beneficiarios ordenados por puntaje — HU-06*

---

### Tesorero

![Dashboard de tesorería](screenshots/17_tesorero_dashboard.png)
*Desembolsos pendientes de confirmación — HU-07*

![Confirmar desembolso](screenshots/18_tesorero_confirmar_desembolso.png)
*Registro de número de transacción y fecha de pago*

---

### Flujo completo — Happy Path

![1. Admin crea convocatoria](screenshots/flujo/01_admin_dashboard_convocatoria_creada.png)
*Paso 1 — Administrador crea la convocatoria*

![2. Formulario de nueva convocatoria](screenshots/flujo/02_admin_formulario_nueva_convocatoria.png)
*Paso 2 — Detalle del formulario de convocatoria*

![3. Estudiante ve convocatoria disponible](screenshots/flujo/03_estudiante_ve_convocatoria_disponible.png)
*Paso 3 — Estudiante visualiza y aplica a la convocatoria*

![4. Solicitud en revisión](screenshots/flujo/04_estudiante_solicitud_en_revision.png)
*Paso 4 — Solicitud enviada con estado EN_REVISION*

![4b. Notificación al postular](screenshots/flujo/04b_estudiante_dashboard_con_notificacion.png)
*Paso 4b — Notificación automática al postular (Observer)*

![5. Evaluador recibe solicitud](screenshots/flujo/05_evaluador_lista_solicitudes.png)
*Paso 5 — Evaluador revisa la solicitud con documentos*

![6. Resultado aprobado 85 pts](screenshots/flujo/06_evaluador_resultado_aprobado_85.png)
*Paso 6 — Evaluación aprobada con 85 puntos (Strategy: puntaje ≥ 60 → APROBADO)*

![7. Admin selecciona beneficiarios](screenshots/flujo/07_admin_ranking_beca_prueba_posicion3.png)
*Paso 7 — Administrador selecciona beneficiarios desde el ranking*

![8. Tesorero confirma desembolso](screenshots/flujo/08_tesorero_dashboard_desembolso_completado.png)
*Paso 8 — Tesorero registra número de transacción y confirma el pago*

![9. Estudiante ve solicitud desembolsada](screenshots/flujo/09_estudiante_solicitud_desembolsada.png)
*Paso 9 — Estudiante visualiza su solicitud como DESEMBOLSADA*

![10. Historial de notificaciones](screenshots/flujo/10_estudiante_notificaciones_flujo_completo.png)
*Paso 10 — Historial completo de notificaciones del flujo (Observer)*

---

## Relación con historias de usuario

| Historia | Descripción | Módulo implementado |
|----------|-------------|---------------------|
| HU-01 | Registro con correo institucional | `auth.service.js` + `Register.jsx` |
| HU-02 | Login seguro con bloqueo por intentos | `loginLimiter` + `Login.jsx` |
| HU-03 | Postulación con documentos obligatorios | `postulacion.template.js` + `Convocatorias.jsx` |
| HU-04 | Gestión de convocatorias por admin | `convocatoria.service.js` + `admin/Dashboard.jsx` |
| HU-05 | Evaluación con puntaje y observación | `evaluacion.strategy.js` + `evaluador/Dashboard.jsx` |
| HU-06 | Selección y confirmación de beneficiarios | `convocatoria.service.js` + `admin/Ranking.jsx` |
| HU-07 | Desembolso con número de transacción | `pago.service.js` + `tesoreria/Desembolsos.jsx` |
| HU-08 | Notificaciones automáticas por eventos | `estado.observer.js` + `Layout.jsx` |
