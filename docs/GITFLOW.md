# Git Flow — Flujo de trabajo con Git

Este documento define **únicamente** cómo trabajamos con Git en el proyecto. Usamos **Git Flow** como modelo de ramas.

Para reglas de código y desarrollo, ver [`AGENTS.md`](./AGENTS.md).

---

## Ramas principales

| Rama | Propósito | Protección |
|---|---|---|
| `main` | Código en producción. Siempre estable y desplegable. | Protegida — solo merge vía PR |
| `develop` | Integración continua. Base de todo el desarrollo activo. | Protegida — solo merge vía PR |

**Regla:** nunca commitear directo en `main` ni `develop`.

---

## Ramas de soporte

| Prefijo | Origen | Destino | Uso |
|---|---|---|---|
| `feature/*` | `develop` | `develop` | Nueva funcionalidad |
| `release/*` | `develop` | `main` + `develop` | Preparar versión para producción |
| `hotfix/*` | `main` | `main` + `develop` | Corrección urgente en producción |

---

## Diagrama

```text
main     ─────●─────────────────●─────────●───────→  (producción)
               \               /           \
hotfix          ●─────────────●             \
                                               \
develop  ───●───●───●───●───●───●───●───●───●───●──→  (integración)
             \     /       \         /
feature       ●───●         ●───────●
```

---

## Convención de nombres

### Features

```text
feature/<scope>-<descripcion-corta>
```

| Scope | Cuándo usar | Ejemplo |
|---|---|---|
| `api` | Cambios en `apps/api/` | `feature/api-tournament-crud` |
| `bot` | Cambios en `apps/bot/` | `feature/bot-schedule-create` |
| `web` | Cambios en `apps/web/` | `feature/web-registration-form` |
| `shared` | Cambios en `packages/shared/` | `feature/shared-registration-schema` |
| `db` | Cambios en `packages/database/` | `feature/db-tournament-model` |
| `docs` | Solo documentación | `feature/docs-commands-update` |
| `infra` | CI/CD, monorepo, tooling | `feature/infra-monorepo-setup` |

Usar **kebab-case** en minúsculas. Sin espacios ni caracteres especiales.

### Releases

```text
release/v<major>.<minor>.<patch>
```

Ejemplo: `release/v0.1.0`

### Hotfixes

```text
hotfix/<descripcion-corta>
```

Ejemplo: `hotfix/fix-score-upload-validation`

---

## Flujo por tipo de rama

### Feature (día a día)

```bash
# 1. Partir de develop actualizado
git checkout develop
git pull origin develop

# 2. Crear rama
git checkout -b feature/bot-attendance-mark

# 3. Trabajar, commitear (ver sección Commits)
git add .
git commit -m "add attendance mark slash command handler"

# 4. Push y abrir PR hacia develop
git push -u origin feature/bot-attendance-mark
```

**Merge:** Pull Request → `develop`. Requiere al menos 1 revisión (si hay más de un colaborador).

---

### Release (preparar versión)

```bash
git checkout develop
git pull origin develop
git checkout -b release/v0.1.0
```

En la rama `release/*` solo van:

- Bug fixes menores
- Ajustes de versión
- Documentación de release
- Preparación de deploy

**No** incluir features nuevas.

```bash
# Al terminar: merge a main (tag) y de vuelta a develop
git checkout main
git merge --no-ff release/v0.1.0
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin main --tags

git checkout develop
git merge --no-ff release/v0.1.0
git push origin develop

# Eliminar rama release
git branch -d release/v0.1.0
git push origin --delete release/v0.1.0
```

---

### Hotfix (urgencia en producción)

```bash
git checkout main
git pull origin main
git checkout -b hotfix/fix-challonge-report-error

# Fix, commit, PR hacia main
git push -u origin hotfix/fix-challonge-report-error
```

Después del merge a `main`:

```bash
git tag -a v0.1.1 -m "Hotfix v0.1.1"
git push origin main --tags

# Sincronizar develop
git checkout develop
git merge --no-ff hotfix/fix-challonge-report-error
git push origin develop
```

---

## Commits

### Formato

Usamos **Conventional Commits** simplificado:

```text
<type>(<scope>): <description>
```

| Type | Uso |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Solo documentación |
| `refactor` | Cambio de código sin alterar comportamiento |
| `chore` | Tooling, deps, config |
| `test` | Tests |

**Idioma:** inglés. **Estilo:** imperativo, minúsculas, sin punto final.

```text
✅ feat(bot): add schedule create command
✅ fix(api): validate tournament id on registration
✅ docs: update commands reference for link add
❌ Added new feature
❌ fix bug
```

### Reglas

- Un commit = un cambio lógico coherente
- No commitear `.env`, tokens ni credenciales
- No mezclar cambios de `api`, `bot` y `web` en un solo commit si se pueden separar

### Scope (monorepo)

Usar el mismo scope que las ramas cuando aplique: `api`, `bot`, `web`, `shared`, `db`, `infra`.

---

## Pull Requests

### Título

Mismo formato que commits:

```text
feat(bot): add attendance mark command
```

### Descripción (español)

```markdown
## Summary
- Qué se hizo y por qué

## Changes
- Lista de cambios relevantes

## Test plan
- [ ] Pasos para verificar
```

### Reglas

| Regla | Detalle |
|---|---|
| Base branch | `feature/*` → `develop` · `release/*` → `main` · `hotfix/*` → `main` |
| Tamaño | PRs pequeños y enfocados — preferir varios PRs chicos a uno gigante |
| Estado de `develop` | Resolver conflictos antes de merge |
| CI | Debe pasar antes de merge (cuando exista pipeline) |
| Squash | Opcional — preferir merge commit (`--no-ff`) en releases y hotfixes |

---

## Versionado

Seguimos **Semantic Versioning** (SemVer): `MAJOR.MINOR.PATCH`

| Incremento | Cuándo |
|---|---|
| MAJOR | Cambio breaking en API, bot o front |
| MINOR | Nueva feature compatible hacia atrás |
| PATCH | Bug fix, hotfix |

Tags en `main`:

```text
v0.1.0
v0.1.1
v0.2.0
```

---

## Monorepo — consideraciones

Un PR puede tocar varias apps si la feature lo requiere (ej. endpoint en API + comando en bot):

```text
feature/api-bot-registration-flow
```

Orden recomendado dentro del PR o en PRs encadenados:

1. `packages/shared` + `packages/database` (schemas, migraciones)
2. `apps/api` (endpoints)
3. `apps/bot` / `apps/web` (clientes)

Si la API debe existir antes que el bot, mergear la parte de API primero o usar un solo PR con commits ordenados.

---

## Comandos de referencia rápida

```bash
# Ver ramas
git branch -a

# Actualizar develop
git checkout develop && git pull origin develop

# Crear feature
git checkout -b feature/<scope>-<nombre>

# Ver estado
git status

# Sync feature con develop (rebase)
git checkout feature/mi-rama
git fetch origin
git rebase origin/develop

# Abortar rebase si algo sale mal
git rebase --abort
```

---

## Qué NO hacer

- ❌ Push directo a `main` o `develop`
- ❌ Mergear features incompletas a `develop`
- ❌ Commitear secrets (`.env`, tokens, API keys)
- ❌ Force push a `main` o `develop` (`git push --force`)
- ❌ Ramas sin prefijo (`fix-stuff`, `new-command`)
- ❌ PRs sin descripción ni test plan

---

## Checklist antes de abrir PR

- [ ] Rama creada desde `develop` (o `main` si es hotfix)
- [ ] Nombre de rama sigue convención `feature/`, `release/` o `hotfix/`
- [ ] Commits en inglés con formato conventional
- [ ] Sin archivos sensibles en el diff
- [ ] Código compila / lint pasa localmente
- [ ] PR apunta a la rama base correcta
- [ ] Descripción con summary y test plan
