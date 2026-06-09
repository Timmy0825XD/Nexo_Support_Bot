import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../types.js';

export const pingCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency and API connection status'),

  async execute(interaction, { apiClient }) {
    const sent = Date.now();
    await interaction.deferReply();

    const wsPing = interaction.client.ws.ping;
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

    const embed = new EmbedBuilder()
      .setTitle('Pong!')
      .setColor(0x57f287)
      .addFields(
        { name: 'Bot Latency', value: `${botLatency}ms`, inline: true },
        { name: 'WebSocket', value: `${wsPing}ms`, inline: true },
        { name: 'API Latency', value: `${apiLatency}ms`, inline: true },
        { name: 'API Status', value: apiStatus, inline: true },
        ...(database ? [{ name: 'Database', value: database, inline: true }] : []),
        {
          name: 'Servers',
          value: `${interaction.client.guilds.cache.size}`,
          inline: true,
        },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
