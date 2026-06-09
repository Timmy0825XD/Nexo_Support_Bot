# MW Tournament Platform

Plataforma open source para gestionar torneos competitivos de **Modern Warships** en Discord. Incluye API REST, bot de Discord y frontend de registro de equipos.

> Documentación del proyecto → [`docs/index.md`](./docs/index.md)

---

## Requisitos

| Herramienta | Versión mínima |
|---|---|
| [Node.js](https://nodejs.org/) | 20 LTS |
| [pnpm](https://pnpm.io/) | 9.x |
| [Supabase](https://supabase.com/) | Proyecto con PostgreSQL |
| [Discord Developer](https://discord.com/developers/applications) | Bot token + Application ID |

---

## Instalación

```bash
git clone https://github.com/<org>/Nexo_Support_Bot.git
cd Nexo_Support_Bot
pnpm install
```

---

## Configuración

### 1. Variables de entorno

```bash
cp apps/api/.env.example apps/api/.env
cp apps/bot/.env.example apps/bot/.env
cp apps/web/.env.example apps/web/.env
cp packages/database/.env.example packages/database/.env
```

### 2. Supabase (PostgreSQL)

En tu proyecto de Supabase → **Settings → Database → Connection string**:

| Variable | Connection string | Uso |
|---|---|---|
| `DATABASE_URL` | **Transaction** pooler (puerto `6543`) | Runtime de la API |
| `DIRECT_URL` | **Session** pooler o direct (puerto `5432`) | Migraciones Prisma |

Copia ambas URLs en:

- `apps/api/.env`
- `packages/database/.env`

> Prisma requiere `directUrl` para migraciones con Supabase. Ver [`packages/database/.env.example`](./packages/database/.env.example).

### 3. Discord Bot

En [Discord Developer Portal](https://discord.com/developers/applications):

1. Crea/selecciona tu aplicación
2. **Bot** → copia el token → `DISCORD_TOKEN`
3. **General Information** → Application ID → `DISCORD_CLIENT_ID`
4. Invita el bot con scope `applications.commands` y permisos básicos

Completa en `apps/bot/.env`:

```env
DISCORD_TOKEN=tu_token
DISCORD_CLIENT_ID=tu_application_id
API_BASE_URL=http://localhost:3000/api
```

### 4. Base de datos — primera vez

```bash
# Sincronizar schema con Supabase
pnpm db:push

# O con migraciones versionadas
pnpm db:migrate
```

---

## Ejecución

### Desarrollo — todos los servicios

```bash
pnpm dev
```

### Por servicio

```bash
pnpm dev:api    # http://localhost:3000/api/health
pnpm dev:bot    # Bot de Discord (/ping)
pnpm dev:web    # http://localhost:3001
```

### Verificar que todo funciona

| Servicio | Cómo probar |
|---|---|
| API | `curl http://localhost:3000/api/health` |
| Web | Abrir `http://localhost:3001` — muestra status de API y DB |
| Bot | En Discord: `/ping` — latencia + conexión API |

### Producción

```bash
pnpm build
pnpm --filter @mw-platform/api start
pnpm --filter @mw-platform/bot start
pnpm --filter @mw-platform/web start
```

---

## Estructura del proyecto

```
Nexo_Support_Bot/
├── apps/
│   ├── api/          # NestJS + Prisma
│   ├── bot/          # discord.js v14
│   └── web/          # Next.js
├── packages/
│   ├── shared/       # Schemas Zod, tipos compartidos
│   └── database/     # Prisma schema (Supabase)
├── docs/             # Documentación (ver docs/index.md)
└── README.md
```

---

## Stack

Node.js · TypeScript · NestJS · Prisma · Supabase · discord.js · Next.js · pnpm · Turborepo

Detalle en [`docs/CONTEXT.md`](./docs/CONTEXT.md#stack-tecnológico).

---

## Licencia

Por definir.

---

## Contribuir

1. Lee [`docs/index.md`](./docs/index.md).
2. Sigue [`docs/GITFLOW.md`](./docs/GITFLOW.md) — ramas `feature/*` desde `develop`.
3. Mensajes del bot y UI en **inglés**; documentación en **español**.
