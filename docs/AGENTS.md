# AGENTS.md — Instrucciones para construir la plataforma

Este documento define las reglas que **deben seguirse** al desarrollar la MW Tournament Platform (API, bot y frontend). Aplica a agentes de IA, colaboradores y cualquier persona que escriba código en este repositorio.

Para contexto funcional del producto, consultar [`CONTEXT.md`](./CONTEXT.md).

---

## Visión de la solución

La plataforma tiene **tres componentes** en este repo:

| Componente | Carpeta (objetivo) | Rol |
|---|---|---|
| **API REST** | `apps/api/` | Cerebro — lógica de negocio, DB, integraciones |
| **Bot Discord** | `apps/bot/` | Interfaz operativa para el staff |
| **Frontend** | `apps/web/` | Registro de equipos — una página por torneo |

**Regla de oro:** bot y front **nunca** acceden a la base de datos. Solo consumen la API.

---

## Stack tecnológico (definido)

| Área | Stack |
|---|---|
| Runtime | Node.js + TypeScript (strict) |
| Monorepo | pnpm workspaces + Turborepo |
| API | NestJS + Prisma + PostgreSQL |
| Bot | discord.js v14 |
| Front | Next.js (App Router) + React Hook Form + TanStack Query + Tailwind |
| Contratos | Zod en `packages/shared` |
| DB | Prisma schema en `packages/database` — solo la API importa el client |
| Logs | Pino (API y bot) |

### NestJS — estructura por módulo de dominio

```
apps/api/src/modules/tournaments/
├── tournaments.module.ts
├── tournaments.controller.ts    # HTTP delgado
├── tournaments.service.ts       # Lógica de negocio
└── tournaments.repository.ts    # Queries Prisma (o inline en service si simple)
```

Crear un módulo NestJS por dominio: `guilds`, `tournaments`, `registration`, `staff`, `challonge`.

### Prisma — acceso a datos

- Schema y migraciones en `packages/database/prisma/schema.prisma`.
- Solo `apps/api` ejecuta queries. Bot y front **nunca** importan `@prisma/client`.
- Tipos de dominio expuestos a clientes vía DTOs/Zod en `packages/shared`, no tipos Prisma crudos.

### discord.js — bot

- Comandos con auto-discovery (carpeta `commands/` → registro dinámico).
- `apiClient` centralizado con base URL desde env, timeout y manejo de errores uniforme.
- `interaction.deferReply()` cuando la API tarde >3s.

### Next.js — front

- Ruta dinámica: `/register/[tournamentId]`.
- React Hook Form + schemas Zod de `packages/shared`.
- TanStack Query para fetch/mutate hacia API.
- UI/copy en inglés.

---

## Política de idiomas

| Ámbito | Idioma | Ejemplos |
|---|---|---|
| **App (bot + front)** | Inglés | Mensajes del bot, formularios, labels, errores de UI |
| **Documentación del repo** | Español | `docs/*.md`, PRs, issues |
| **Conversaciones del equipo** | Español | Planning, revisiones informales |
| **Código fuente** | Inglés | Identificadores, archivos, funciones, commits |

```typescript
// ✅ CORRECTO — usuario final en inglés
await interaction.reply({ content: 'Registration is now open.', ephemeral: true });

// ❌ INCORRECTO
await interaction.reply({ content: 'El registro ya está abierto.', ephemeral: true });
```

---

## Principios arquitectónicos (innegociables)

### 1. La API es el cerebro

- Toda lógica de negocio, validaciones y persistencia viven en la API.
- Bot y front son clientes delgados: presentan datos y delegan decisiones.
- No duplicar reglas de negocio entre API, bot y front. Si el bot necesita validar algo para UX (permisos Discord), la API sigue siendo la autoridad final.

### 2. Eficiencia y respuesta

- Minimizar round-trips: diseñar endpoints que entreguen lo necesario en una sola llamada cuando tenga sentido.
- Bot: responder a interacciones de Discord dentro de los límites de latencia (defer/reply ephemeral cuando la API tarde).
- Front: cargas rápidas, formularios ligeros, feedback inmediato al usuario.
- API: queries optimizadas, índices adecuados, evitar N+1; cachear datos de lectura frecuente cuando aplique.
- No bloquear el event loop — operaciones pesadas async con timeouts y retry controlado.

### 3. Mantenibilidad y escalabilidad

- **Modularidad:** cada feature en su módulo (comando, route, página).
- **Aislamiento:** un comando/route nuevo no rompe existentes.
- **Stateless:** API y bot sin estado en memoria que impida escalar horizontalmente.
- **Tipos compartidos:** schemas/DTOs en `packages/` para mantener contrato API ↔ clientes sincronizado.
- **Convenciones consistentes** entre los tres componentes.

### 4. Buenas prácticas de programación

- TypeScript estricto (`strict: true`) en todo el monorepo.
- Funciones pequeñas, una responsabilidad clara (SRP).
- Dependencias explícitas; inyección donde el framework lo permita.
- Sin abstracciones prematuras — extraer solo cuando el patrón se repita 3+ veces.
- Errores tipados; logs estructurados con contexto (`guildId`, `tournamentId`, etc.).
- No añadir dependencias sin justificación clara.

### 5. Multi-servidor y multi-torneo

- Configuración por `guildId` (servidor Discord).
- Hasta 4 torneos activos por servidor.
- Toda operación de torneo identifica explícitamente el `tournamentId`.

---

## Responsabilidades por componente

### API (`apps/api/`)

```
Responsable de:
  ✅ CRUD torneos, equipos, staff, participantes
  ✅ Reglas de negocio y validaciones
  ✅ Acceso a base de datos
  ✅ Integración Challonge (read, report)
  ✅ Generación de URLs de registro por torneo
  ✅ Encriptación/gestión de API keys sensibles

NO responsable de:
  ❌ Crear canales Discord
  ❌ Generar transcripts HTML
  ❌ UI de Discord o web
```

**Estructura objetivo:**

```
apps/api/
├── src/
│   ├── modules/
│   │   ├── guilds/
│   │   ├── tournaments/
│   │   ├── registration/
│   │   ├── staff/
│   │   └── challonge/
│   ├── common/           # Exception filters, pipes, guards
│   └── main.ts
```

```
packages/database/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── src/
    └── index.ts          # export PrismaClient singleton
```

### Bot (`apps/bot/`)

```
Responsable de:
  ✅ Comandos slash + prefix
  ✅ Canales, roles, permisos Discord
  ✅ Tickets y transcripts HTML
  ✅ Consumo de API REST

NO responsable de:
  ❌ Lógica de negocio
  ❌ Acceso directo a DB
  ❌ Formulario web de registro
  ❌ Crear/modificar estructura de bracket en Challonge
```

**Estructura objetivo:**

```
apps/bot/
├── src/
│   ├── commands/
│   │   ├── slash/
│   │   └── prefix/
│   ├── events/
│   ├── services/         # apiClient, transcripts, discord helpers
│   ├── guards/           # Permission checks reutilizables
│   └── index.ts
```

- Un archivo por comando; lógica compartida slash/prefix en handlers.
- Auto-discovery de comandos — no editar un registro central por cada comando nuevo.
- Descripciones de slash commands en **inglés**.

### Frontend (`apps/web/`)

```
Responsable de:
  ✅ Página pública de registro por torneo
  ✅ Formulario de inscripción de equipos (campos TBD)
  ✅ Consumo de API REST
  ✅ UX clara y rápida

NO responsable de:
  ❌ Lógica de negocio
  ❌ Gestión del torneo (eso es del bot)
  ❌ Acceso directo a DB
```

**Estructura objetivo:**

```
apps/web/
├── src/
│   ├── app/
│   │   └── register/[tournamentId]/page.tsx
│   ├── components/
│   └── lib/
│       └── api.ts        # fetch wrapper hacia NestJS
```

- UI y copy en **inglés**.
- Validación de formulario en front solo para UX; la API valida de verdad.

---

## Jerarquía de permisos (bot)

| Rol | Alcance |
|---|---|
| Organizer | Torneo asignado (máx. 2 por torneo) |
| Helper | Torneo asignado (2–3 por torneo) |
| Judge | Acciones de juez en su partido/ticket |
| Recorder | Acciones de recorder en su partido/ticket |
| Participant (Captain) | Solo su propio ticket |

Implementar checks como guards/middleware reutilizables — **no duplicar lógica** por comando.

### Tickets — acceso a canales

| Momento | Miembros |
|---|---|
| Creación | Organizer, Helper, ambos Team Captains |
| Al crear schedule | + Judge, Recorder |

---

## Contrato API ↔ clientes

- Schemas Zod en `packages/shared` — fuente de verdad del contrato HTTP.
- NestJS valida con `ZodValidationPipe` o equivalente; no duplicar schemas en la API.
- Tipos inferidos con `z.infer<typeof Schema>` — compartidos por bot y front.
- Versionar endpoints si el contrato cambia de forma breaking.
- Errores de API con códigos HTTP semánticos y body consistente:

```json
{ "error": { "code": "REGISTRATION_CLOSED", "message": "Registration is closed for this tournament." } }
```

- Bot mapea errores de API a mensajes claros en inglés.
- Front muestra errores de API al usuario sin exponer detalles internos.

---

## Integraciones externas

### Challonge

| Operación | Dónde | Permitido |
|---|---|---|
| READ | API (bot consume vía API) | ✅ |
| REPORT | API (bot consume vía API) | ✅ |
| CREATE/MODIFY bracket | — | ❌ |

API keys encriptadas en DB; nunca en plaintext en bot, front ni logs.

### Discord (solo bot)

- Gateway events, slash commands, channel/role management.
- Transcripts HTML al cerrar tickets — replicar Discord visualmente, **no persistir en DB**.

---

## Seguridad

- Nunca commitear tokens, API keys ni `.env`.
- Documentar variables en `.env.example` por app.
- Validar env vars al iniciar cada servicio — fail fast.
- No loguear datos sensibles de participantes ni credenciales.
- Sanitizar inputs antes de persistir o usar en nombres de canal.
- Bot valida permisos Discord; API valida autorización de negocio — **ambas capas**.

---

## Flujo de desarrollo

1. Leer `docs/index.md` y los documentos que indique según la tarea.
2. **API primero** cuando la feature requiera persistencia o reglas de negocio.
3. Implementar solo la fase del roadmap correspondiente.
4. No modificar archivos ajenos a la tarea.
5. No crear tests, docs extra ni abstracciones no solicitadas sin valor real.

### Git y commits

Ver [`GITFLOW.md`](./GITFLOW.md) para ramas, PRs y versionado. Resumen de commits:

- Formato: `feat(api): add tournament registration endpoint`
- Idioma: inglés, imperativo
- Un commit = un cambio lógico coherente

---

## Checklist antes de entregar código

### General

- [ ] Lógica de negocio solo en la API
- [ ] Bot y front no acceden a DB
- [ ] Tipos/schemas compartidos actualizados si cambió el contrato
- [ ] Errores logueados con contexto; mensajes al usuario en inglés
- [ ] Sin secrets hardcodeados

### API

- [ ] Endpoint delgado; lógica en service
- [ ] Validación de input en la API (no solo en clientes)
- [ ] Queries eficientes; sin N+1 evidente

### Bot

- [ ] Permisos de rol verificados
- [ ] Comandos de torneo identifican `tournamentId`
- [ ] Interacciones Discord no exceden timeout (defer si necesario)
- [ ] Comando autocontenido

### Front

- [ ] Solo consume API; sin lógica de negocio duplicada
- [ ] UI/copy en inglés
- [ ] Feedback claro en envío del formulario

---

## Referencia rápida

| Documento | Propósito | Idioma |
|---|---|---|
| `README.md` | Instalación y ejecución | Español |
| `docs/index.md` | Índice de documentación | Español |
| `docs/CONTEXT.md` | Contexto, arquitectura, roadmap | Español |
| `docs/AGENTS.md` | Reglas técnicas y de proceso | Español |
| `docs/COMMANDS.md` | Referencia de comandos del bot | Español (specs) / Inglés (nombres del bot) |
| `docs/GITFLOW.md` | Flujo Git Flow, commits y PRs | Español |
| Código fuente | Implementación | Inglés |
| Bot + Front (usuarios) | Interacción con staff y equipos | Inglés |
