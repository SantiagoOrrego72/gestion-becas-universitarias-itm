# Guía de contribución

## Estrategia de ramas

Este proyecto usa **Git Flow simplificado**:

| Rama | Propósito |
|------|-----------|
| `master` | Código estable listo para producción. Solo recibe merges desde `develop` o `hotfix/*`. |
| `develop` | Rama de integración. Todas las features se mergean aquí primero. |
| `feature/*` | Desarrollo de nuevas funcionalidades. Sale de `develop` y vuelve a `develop`. |
| `hotfix/*` | Correcciones urgentes. Sale de `master`, se mergea a `master` y a `develop`. |
| `release/*` | Preparación de una nueva versión. Sale de `develop`, se mergea a `master` y a `develop`. |

### Diagrama de flujo

```
master ──────────────────────────────────────────────► (producción)
   │                         ▲
   └── develop ──────────────┤
            │        ▲       │
            ├─ feature/auth ─┤
            ├─ feature/convocatorias ─┤
            └─ feature/solicitudes ──┘
```

---

## Nomenclatura de ramas

```
feature/<nombre-corto-en-kebab-case>
hotfix/<descripcion-del-bug>
release/v<major>.<minor>.<patch>
```

**Ejemplos:**
```
feature/notificaciones-push
feature/exportar-ranking-pdf
hotfix/fix-jwt-expiration
release/v1.1.0
```

---

## Convención de commits

Seguimos **Conventional Commits**:

```
<tipo>(<alcance>): <descripción corta en minúsculas>
```

### Tipos permitidos

| Tipo | Cuándo usarlo |
|------|---------------|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Cambios solo en documentación |
| `style` | Formato, punto y coma, etc. (sin cambio de lógica) |
| `refactor` | Refactorización sin nueva feature ni fix |
| `test` | Añadir o corregir tests |
| `chore` | Tareas de mantenimiento (deps, config, build) |

### Ejemplos

```
feat(auth): agregar refresh token al login
fix(solicitudes): corregir validación de carta de motivación vacía
docs(readme): actualizar instrucciones de instalación
refactor(evaluacion): extraer lógica de puntaje a helper
chore(deps): actualizar prisma a 5.15.0
```

---

## Flujo de trabajo para una nueva feature

```bash
# 1. Asegurarte de estar en develop actualizado
git checkout develop
git pull origin develop

# 2. Crear tu rama de feature
git checkout -b feature/mi-nueva-funcionalidad

# 3. Desarrollar, hacer commits frecuentes y descriptivos
git add .
git commit -m "feat(módulo): descripción del cambio"

# 4. Subir la rama al remoto
git push -u origin feature/mi-nueva-funcionalidad

# 5. Abrir un Pull Request hacia develop en GitHub
# Usar la plantilla de PR en .github/PULL_REQUEST_TEMPLATE.md
```

---

## Reglas para Pull Requests

- El PR siempre apunta a `develop` (nunca directamente a `master`)
- El título del PR sigue la misma convención de commits
- Describir qué se hizo, por qué y cómo probarlo
- Resolver todos los conflictos antes de solicitar revisión
- Un PR = una funcionalidad o fix bien delimitado

---

## Flujo hotfix (bug en producción)

```bash
git checkout master
git pull origin master
git checkout -b hotfix/descripcion-del-bug

# ... corregir el bug ...

git commit -m "fix(módulo): descripción del fix"
git push -u origin hotfix/descripcion-del-bug
# Abrir PR hacia master Y hacia develop
```

---

*Instituto Tecnológico Metropolitano — Diseño de Sistemas de Información*
