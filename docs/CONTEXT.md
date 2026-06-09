# MW Tournament Platform — Contexto del proyecto

Plataforma para gestionar torneos competitivos de **Modern Warships** dentro del ecosistema de servidores de Discord reconocidos por ArtStorm. Permite registrar equipos, operar el torneo desde Discord y centralizar toda la lógica en una API REST propia.

> **Idioma de la app (bot + front):** inglés (mensajes, formularios, UI).  
> **Documentación del repo:** español. Ver [`AGENTS.md`](./AGENTS.md) para las reglas de construcción del proyecto.

---

## Objetivo del proyecto

Construir una solución **mantenible, escalable y eficiente** compuesta por tres partes que viven en este repositorio. La API es el cerebro; el bot y el front son capas de interfaz especializadas.

| Componente | Rol | Responsabilidad |
|---|---|---|
| **API REST** | Cerebro | Lógica de negocio, persistencia, validaciones, integraciones (Challonge, etc.) |
| **Bot de Discord** | Interfaz operativa | Gestión del torneo por el staff: comandos, canales, roles, tickets, transcripts |
| **Frontend web** | Interfaz de registro | Página por torneo donde los equipos se inscriben (campos por definir) |

### Principio central

**Ningún cliente accede a la base de datos directamente.** Bot y front consumen exclusivamente la API REST. Toda decisión de negocio vive en un solo lugar.

### Fuera de alcance de la plataforma

| Responsabilidad | Quién la maneja |
|---|---|
| Propuesta y aprobación de torneos | ArtStorm (externo) |
| Contenido del ruleset | Externo (el bot solo publica un enlace URL) |
| Creación y seeding del bracket | Organizador (manual en Challonge) |

---

## Contexto

**Modern Warships** es un juego de combate naval con un ecosistema competitivo oficial compuesto por ~40 servidores de Discord independientes, reconocidos por **ArtStorm** (desarrollador del juego).

Cada servidor organiza sus propios torneos con reglas, staff y comunidad propias. Esta plataforma opera como **motor operativo** del torneo en cada servidor.

### Multi-servidor

El bot atiende **múltiples servidores de Discord de forma simultánea e independiente**. Cada servidor tiene:

- Su propia configuración almacenada (vía API)
- Su propio staff y participantes
- Hasta **4 torneos activos** al mismo tiempo

Los comandos que operan sobre un torneo específico requieren identificar cuál torneo se está gestionando (parámetro o selección interactiva).

---

## Arquitectura

```
                    ┌─────────────────────────────────────┐
                    │           REST API (cerebro)         │
                    │  Lógica · Validaciones · DB · Cache  │
                    └───────────┬─────────────┬───────────┘
                                │             │
              registro equipos  │             │  gestión torneo
                                │             │
                    ┌───────────▼───┐   ┌─────▼─────────────┐
                    │   Frontend    │   │   Bot Discord     │
                    │  (1 pág/torneo)│   │  (staff/comandos) │
                    └───────────────┘   └─────────┬─────────┘
                                                    │
                                          Challonge API
                                          Discord Gateway
```

### Flujo de registro

1. El staff abre el registro desde Discord (bot → API).
2. La API genera/expone la URL de la página del torneo.
3. Los capitanes completan el formulario en el front (front → API).
4. El staff valida participantes desde Discord (bot → API).

Los campos del formulario de registro se definirán en una fase posterior.

---

## Alcance por componente

### API REST

- CRUD de torneos, servidores, staff y participantes
- Apertura/cierre/validación de registro
- Integración con Challonge (read, report)
- Persistencia y reglas de negocio
- Endpoints consumidos por bot y front

### Bot de Discord

Cubre el ciclo operativo del torneo desde la perspectiva del staff:

1. **Configuración** — Setup del torneo por servidor
2. **Registro** — Abrir, cerrar y validar participantes (no el formulario web)
3. **Bracket (Challonge)** — Leer partidos, crear salas, reportar resultados
4. **Tickets** — Canales privados por ronda del bracket
5. **Horarios** — Creación y gestión de schedules por partido
6. **Resultados** — Registro de resultados del juez y actualización del bracket
7. **Asistencia** — Tracking de asistencia y trabajo del staff
8. **Transcripts** — Generación automática al cerrar un ticket
9. **Staff** — Asignar/remover roles por torneo
10. **Moderación** — Control de canales, roles, purge, etc.
11. **Administración** — Herramientas de administración del servidor

**No hace:** acceso directo a DB, formulario de registro web, creación/seeding de bracket.

### Frontend web

- Una página pública por torneo activo con registro abierto
- Formulario de inscripción de equipos (campos TBD)
- Consume la API REST; sin lógica de negocio propia
- UI en inglés

---

## Roles y permisos (bot)

Jerarquía estricta. Cada comando sensible está restringido a uno o más roles:

| Rol | Cantidad | Acceso |
|---|---|---|
| **Organizer** | 2 por torneo | Control operativo completo de su torneo asignado. Gestiona staff, configuración y actividad. |
| **Helper** | 2–3 por torneo | Asiste a organizadores. Gestiona tickets, crea horarios, guía jueces y recorders. |
| **Judge** | — | Crea salas de juego, verifica reglas, envía resultado oficial en el ticket. |
| **Recorder** | — | Graba partidos y publica evidencia. Se añade al ticket solo cuando se crea el schedule del partido. |
| **Participant** (Team Captain) | — | Acceso únicamente a su propio ticket. Sin comandos de staff. |

---

## Sistema de tickets

Feature crítica del bot. Cada **ronda del bracket = un ticket** (canal privado de Discord).

### Reglas de acceso

| Momento | Quién tiene acceso |
|---|---|
| Siempre | Organizer, Helper, ambos Team Captains |
| Al crear schedule | + Judge, Recorder |

### Transcripts

Al cerrar un ticket, el bot genera un **transcript HTML completo** del canal y lo envía al canal configurado. **No se almacena en base de datos** — vive solo en Discord. Debe replicar visualmente un canal real (formato, avatares, colores de rol, timestamps, embeds, media).

---

## Integración con Challonge

El organizador crea y seedea el bracket manualmente. La plataforma **no modifica la estructura del bracket**.

| Operación | Quién | Descripción |
|---|---|---|
| **READ** | API / Bot | Obtiene bracket, partidos y rondas activas |
| **CREATE** | Bot | Crea canales de Discord por partido |
| **REPORT** | API / Bot | Envía resultados para avanzar el bracket |

Configuración por torneo: **Challonge Tournament ID** y **API Key encriptada** (gestionadas vía API, configuradas desde el bot).

---

## Sistema de comandos (bot)

| Tipo | Ejemplo | Notas |
|---|---|---|
| Slash commands | `/command` | Nativos de Discord |
| Prefix commands | `[]command` | Prefijo por defecto `[]`, configurable por servidor |

Categorías: Attendance · Tournament management · Schedule management · Moderation · Settings and setup · Utility and fun.

**Principio:** cada comando es aislado y autocontenido. Añadir comandos nuevos no debe afectar los existentes.

---

## Multi-torneo

- Máximo **4 torneos activos** por servidor de Discord
- Comandos y páginas de registro operan sobre un torneo específico identificado explícitamente

---

## Principios de diseño

Estos principios aplican a **toda la plataforma** (API, bot y front):

| Principio | Qué significa en la práctica |
|---|---|
| **Eficiencia** | Respuestas rápidas en bot, front y API; evitar round-trips innecesarios |
| **Escalabilidad** | Multi-servidor, multi-torneo; componentes desacoplados y stateless donde sea posible |
| **Mantenibilidad** | Código modular, responsabilidades claras, convenciones consistentes |
| **Single source of truth** | La API concentra reglas de negocio; clientes no duplican validaciones |
| **Separación de capas** | Controllers/handlers delgados; lógica en services/domain |

---

## Stack tecnológico

Stack definido para mantenibilidad, escalabilidad y tipado compartido entre los tres clientes.

### Decisiones principales

| Decisión | Elección | Por qué |
|---|---|---|
| API framework | **NestJS** | Módulos, DI, guards y estructura que escala con el dominio del torneo |
| ORM | **Prisma** | Tipado fuerte, migraciones claras, buen DX con PostgreSQL |
| Bot | **discord.js v14** | Estándar en TypeScript, soporte completo de slash commands |
| Front | **Next.js** (App Router) | Formularios por torneo, SSR/SSG según necesidad |
| Monorepo | **pnpm + Turborepo** | Builds cacheados, dependencias compartidas eficientes |
| Validación compartida | **Zod** (`packages/shared`) | Un contrato para API, bot y front |
| Base de datos | **PostgreSQL** | Relacional, multi-tenant por guild, JSONB para campos flexibles de registro |

> **NestJS vs Express:** Express es más ligero al inicio, pero nuestro dominio (torneos, staff, registro, Challonge, multi-servidor) crece rápido. NestJS impone capas claras (module → controller → service → repository) que evitan el “spaghetti” cuando hay decenas de endpoints y reglas de negocio.

> **Prisma vs Drizzle/TypeORM:** Drizzle es más liviano y cercano al SQL; TypeORM encaja con Nest pero tiene peor DX en migraciones. Prisma equilibra productividad, tipos generados y migraciones predecibles — ideal para un equipo que construye iterativamente.

### Stack por componente

| Capa | Tecnologías |
|---|---|
| **API** | NestJS · Prisma · PostgreSQL · Zod · Pino (logs) |
| **Bot** | Node.js · discord.js v14 · TS · cliente HTTP hacia API |
| **Front** | Next.js (App Router) · React Hook Form · Zod · TanStack Query · Tailwind CSS |
| **Compartido** | TypeScript strict · `packages/shared` (schemas Zod, tipos, constantes) · `packages/database` (Prisma schema + client) |
| **Integraciones** | Challonge REST API · Discord Gateway |
| **Cache (fase posterior)** | Redis — config por guild, torneos activos, rate limiting |

### Validación y contratos

```
packages/shared/src/schemas/   ← Zod (fuente de verdad del contrato)
         │
         ├── apps/api/          ← NestJS valida request/response
         ├── apps/bot/          ← Tipos + payloads hacia API
         └── apps/web/          ← Formularios + fetch con mismos schemas
```

La API valida **siempre** en servidor. Bot y front usan los mismos schemas solo para UX (formularios, autocompletado), no como única barrera de seguridad.

---

## Estructura del repositorio

```
Nexo_Support_Bot/
├── apps/
│   ├── api/                    # NestJS — cerebro
│   ├── bot/                    # discord.js — interfaz Discord
│   └── web/                    # Next.js — registro de equipos
├── packages/
│   ├── shared/                 # Zod schemas, tipos, constantes, utils
│   └── database/               # Prisma schema, migrations, client export
├── docs/                       # Documentación del proyecto
│   ├── index.md                # Índice de archivos
│   ├── CONTEXT.md
│   ├── AGENTS.md
│   ├── COMMANDS.md
│   ├── EMOJIS.md
│   └── GITFLOW.md
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md                   # Instalación y ejecución (open source)
```

Cada módulo de NestJS sigue: **controller → service → repository (Prisma)**. Sin lógica de negocio en controllers.

---

## Roadmap de desarrollo

Desarrollo incremental. La API es prioridad base; bot y front dependen de ella.

- [x] **Fase 0 — Fundamentos** — Estructura monorepo, API base, conexión bot↔API, esqueleto del front
- [ ] **Fase 1 — Configuración por servidor** — Settings, prefijo, multi-servidor (API + bot)
- [ ] **Fase 2 — Torneos y registro** — CRUD torneos, página de registro por torneo, open/close/validate
- [ ] **Fase 3 — Staff y roles** — Asignación de staff por torneo, permisos en bot
- [ ] **Fase 4 — Integración Challonge** — Read bracket, report results
- [ ] **Fase 5 — Sistema de tickets** — Canales, permisos, cierre
- [ ] **Fase 6 — Schedules y resultados** — Horarios, flujo juez/recorder
- [ ] **Fase 7 — Transcripts** — Generación HTML fiel a Discord
- [ ] **Fase 8 — Attendance y moderación** — Tracking staff, utilidades de moderación
- [ ] **Fase 9 — Pulido y despliegue** — Performance, testing, deploy

---

## Glosario

| Término | Definición |
|---|---|
| **Ticket** | Canal privado de Discord que representa una ronda del bracket |
| **Schedule** | Horario asignado a un partido; activa la inclusión de Judge y Recorder |
| **Room** | Canal/sala de Discord creado para un partido |
| **Transcript** | Export HTML del historial completo de un ticket |
| **ArtStorm** | Desarrollador de Modern Warships |
| **Challonge** | Plataforma externa de brackets competitivos |

---

## Documentación del repositorio

Ver [`index.md`](./index.md) para el índice completo de archivos en `docs/`.
