# Custom Emojis — Bot embeds

Referencia de emojis personalizados (animados) usados en las respuestas del bot. **Siempre importar desde código** — no hardcodear IDs en cada comando.

> Implementación en código: [`apps/bot/src/constants/emojis.ts`](../apps/bot/src/constants/emojis.ts)

---

## Reglas de uso

- Respuestas del bot en **inglés**, claras y coherentes.
- Preferir **embeds** sobre texto plano para respuestas informativas.
- Usar el emoji según su **propósito**, no decorar al azar.
- Éxito → `done` · Error → `error` · Métricas → emoji correspondiente.
- Si se agrega un emoji nuevo, actualizar **esta tabla** y `emojis.ts`.

---

## Catálogo

| Key | Markdown | ID | Propósito |
|---|---|---|---|
| `done` | `<a:done:1513760252221325383>` | `1513760252221325383` | Proceso finalizado con éxito |
| `error` | `<a:error:1513760971066183900>` | `1513760971066183900` | Ocurrió un error |
| `latency` | `<a:latency:1513761208971296919>` | `1513761208971296919` | Info general de ping / latencia |
| `webSocket` | `<a:web_socket:1513761799651197018>` | `1513761799651197018` | WebSocket ping |
| `botPing` | `<a:bot_ping:1513762217147895919>` | `1513762217147895919` | Bot latency |
| `database` | `<a:database:1513762474162258000>` | `1513762474162258000` | Estado o info de base de datos |
| `servers` | `<a:servers:1513762963184422963>` | `1513762963184422963` | Info de servidores (guilds) |

---

## Ejemplo en embed

```typescript
import { CUSTOM_EMOJIS, EMBED_COLORS } from '../constants/emojis.js';

embed.addFields({
  name: `${CUSTOM_EMOJIS.botPing} Bot Latency`,
  value: `${botLatency}ms`,
  inline: true,
});
```

---

## Notas

- Los emojis deben existir en un servidor donde el bot tenga acceso, o como emojis de la aplicación.
- Este catálogo se ampliará conforme se implementen más comandos.
