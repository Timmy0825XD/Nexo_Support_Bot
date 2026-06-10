import { CUSTOM_EMOJIS, EMBED_COLORS } from '../../constants/emojis.js';
import { embedField, infoEmbed } from '../../utils/embeds.js';
import type { PrefixCommand } from '../types.js';

export const pingPrefixCommand: PrefixCommand = {
  name: 'ping',

  async execute(message, _args, { apiClient }) {
    const sent = Date.now();
    const wsPing = message.client.ws.ping;
    const botLatency = Date.now() - sent;

    let apiStatus = 'unreachable';
    let apiLatency = 0;
    let database: string | undefined;

    const apiStart = Date.now();
    try {
      const health = await apiClient.getHealth();
      apiLatency = Date.now() - apiStart;
      apiStatus = health.status;
      database = health.database;
    } catch {
      apiLatency = Date.now() - apiStart;
    }

    const apiOk = apiStatus === 'ok';
    const dbOk = database === 'connected';
    const allHealthy = apiOk && (database === undefined || dbOk);

    const statusLine = allHealthy
      ? `**All systems operational.** Response times look good.`
      : `**Attention required.** One or more services are not responding correctly.`;

    const embed = infoEmbed(`Pong!`, statusLine)
      .setColor(allHealthy ? EMBED_COLORS.success : EMBED_COLORS.warning)
      .addFields(
        embedField(`${CUSTOM_EMOJIS.botPing} Bot Latency`, `\`${botLatency}ms\``),
        embedField(`${CUSTOM_EMOJIS.webSocket} WebSocket`, `\`${wsPing}ms\``),
        embedField(`${CUSTOM_EMOJIS.latency} API Latency`, `\`${apiLatency}ms\``),
        embedField(
          `${apiOk ? CUSTOM_EMOJIS.done : CUSTOM_EMOJIS.error} API Status`,
          apiOk ? '`Online`' : `\`${apiStatus}\``,
        ),
        ...(database
          ? [
              embedField(
                `${dbOk ? CUSTOM_EMOJIS.database : CUSTOM_EMOJIS.error} Database`,
                dbOk ? '`Connected`' : `\`${database}\``,
              ),
            ]
          : []),
        embedField(
          `${CUSTOM_EMOJIS.servers} Servers`,
          `\`${message.client.guilds.cache.size}\``,
        ),
      );

    await message.reply({ embeds: [embed] });
  },
};
