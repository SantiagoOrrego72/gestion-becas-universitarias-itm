# 🎓 Sistema de Gestión de Becas Universitarias — ITM

Sistema web full-stack para la administración integral del proceso de becas universitarias del Instituto Tecnológico Metropolitano (ITM). Permite a estudiantes postularse a convocatorias, a evaluadores revisar solicitudes y a tesorería gestionar desembolsos, todo desde una interfaz centralizada con control de acceso por roles.

---

## 📋 Tabla de contenidos

- [Características](#-características)
- [Stack tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Requisitos previos](#-requisitos-previos)
- [Instalación y puesta en marcha](#-instalación-y-puesta-en-marcha)
- [Variables de entorno](#-variables-de-entorno)
- [Roles del sistema](#-roles-del-sistema)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Endpoints principales](#-endpoints-principales)
- [Estrategia de ramas](#-estrategia-de-ramas)

---

## ✨ Características

- Autenticación con JWT y control de acceso por rol (RBAC)
- Gestión completa de convocatorias (crear, publicar, cerrar)
- Flujo de postulación con carga de documentos PDF
- Módulo de evaluación con puntaje y observaciones
- Gestión de desembolsos y seguimiento de pagos
- Notificaciones internas en tiempo real
- Auditoría de acciones sobre entidades clave
- Rate limiting, CORS y cabeceras de seguridad (Helmet)

---

## 🛠 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18, React Router v6, Context API |
| Backend | Node.js, Express 4 |
| ORM / BD | Prisma 5, PostgreSQL |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Validación | express-validator |
| Archivos | Multer |
| Logs | Winston, Morgan |
| Seguridad | Helmet, express-rate-limit |

---

## 🏗 Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                        Frontend                          │
│         React + Context API (puerto 5173)                │
│   Login / Register → Dashboard por rol → Módulos        │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP / REST API
┌──────────────────────────▼──────────────────────────────┐
│                        Backend                           │
│           Express API REST (puerto 3000)                 │
│  Routes → Middleware (auth / roles / validate) →         │
│  Controllers → Services → Prisma ORM                    │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                      PostgreSQL                          │
│  usuarios · estudiantes · convocatorias · solicitudes    │
│  documentos · evaluaciones · pagos · notificaciones      │
│  auditoria                                               │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Requisitos previos

- Node.js ≥ 18
- PostgreSQL ≥ 14
- npm ≥ 9

---

## 🚀 Instalación y puesta en marcha

### 1. Clonar el repositorio

```bash
git clone https://github.com/SantiagoOrrego72/gestion-becas-universitarias-itm.git
cd gestion-becas-universitarias-itm
```

### 2. Configurar el backend

```bash
cd backend
cp .env.example .env
# Editar .env con las credenciales de tu base de datos PostgreSQL
npm run setup
# Esto instala dependencias, genera el cliente Prisma, corre migraciones y ejecuta el seed
```

### 3. Iniciar el backend

```bash
npm run dev
# API disponible en http://localhost:3000
```

### 4. Configurar e iniciar el frontend

```bash
cd ../frontend
npm install
npm run dev
# App disponible en http://localhost:5173
```

### Usuarios de prueba (seed)

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Administrador | admin@itm.edu.co | Admin123! |
| Evaluador | evaluador@itm.edu.co | Eval123! |
| Tesorero | tesorero@itm.edu.co | Teso123! |
| Estudiante | estudiante@itm.edu.co | Estu123! |

---

## 🔐 Variables de entorno

Crear `backend/.env` basado en `backend/.env.example`:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Cadena de conexión PostgreSQL | `postgresql://user:pass@localhost:5432/becas_db` |
| `JWT_SECRET` | Secreto para firmar tokens JWT | cadena aleatoria larga |
| `JWT_EXPIRES_IN` | Duración del token | `7d` |
| `PORT` | Puerto del servidor backend | `3000` |
| `FRONTEND_URL` | URL del frontend (CORS) | `http://localhost:5173` |
| `MAX_FILE_SIZE` | Tamaño máximo de archivo en bytes | `5242880` (5 MB) |
| `UPLOAD_PATH` | Ruta para archivos subidos | `./uploads` |

---

## 👥 Roles del sistema

| Rol | Descripción | Permisos principales |
|-----|-------------|---------------------|
| `ESTUDIANTE` | Estudiante postulante | Ver convocatorias, postular, subir documentos |
| `EVALUADOR` | Evalúa solicitudes | Ver y evaluar solicitudes asignadas |
| `ADMINISTRADOR` | Gestiona el sistema | CRUD convocatorias, ver ranking, cambiar estados |
| `TESORERO` | Maneja pagos | Ver solicitudes aprobadas, registrar desembolsos |

---

## 📁 Estructura del proyecto

```
gestion-becas-universitarias-itm/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Modelos de base de datos
│   │   ├── migrations/            # Migraciones de BD
│   │   └── seed.js                # Datos iniciales
│   ├── src/
│   │   ├── config/                # Configuración (Prisma client)
│   │   ├── controllers/           # Lógica de peticiones HTTP
│   │   ├── middleware/            # Auth, roles, validación, errores
│   │   ├── routes/                # Definición de endpoints
│   │   ├── services/              # Lógica de negocio
│   │   ├── utils/                 # JWT, logger, respuestas
│   │   └── validators/            # Reglas de validación
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/                   # Clientes HTTP por módulo
│   │   ├── components/            # Componentes reutilizables
│   │   ├── context/               # AuthContext, ToastContext
│   │   ├── pages/                 # Páginas por rol
│   │   │   ├── admin/
│   │   │   ├── estudiante/
│   │   │   ├── evaluador/
│   │   │   └── tesoreria/
│   │   └── utils/                 # Helpers de formato
│   └── package.json
├── .github/
│   └── PULL_REQUEST_TEMPLATE.md
├── CONTRIBUTING.md
└── README.md
```

---

## 🔌 Endpoints principales

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Login, retorna JWT |
| GET | `/api/auth/profile` | Perfil del usuario autenticado |
| PUT | `/api/auth/profile` | Actualizar perfil |

### Convocatorias
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/convocatorias` | Listar convocatorias |
| POST | `/api/convocatorias` | Crear convocatoria (ADMIN) |
| PATCH | `/api/convocatorias/:id` | Actualizar convocatoria (ADMIN) |

### Solicitudes
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/solicitudes` | Listar (filtrado por rol) |
| POST | `/api/solicitudes` | Crear solicitud (ESTUDIANTE) |
| PATCH | `/api/solicitudes/:id/estado` | Cambiar estado (ADMIN/EVALUADOR) |

### Documentos, Evaluaciones, Pagos, Notificaciones
Cada módulo sigue el patrón REST estándar bajo `/api/{módulo}`.

---

## 🌿 Estrategia de ramas

Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para el flujo de trabajo completo.

```
master          ← código estable (releases)
develop         ← integración de features
feature/*       ← desarrollo de funcionalidades
hotfix/*        ← correcciones urgentes en producción
release/*       ← preparación de versión
```

---

*Proyecto académico — Diseño de Sistemas de Información · ITM 2024*
