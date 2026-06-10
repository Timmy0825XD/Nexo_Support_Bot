import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { ApiClientError } from '../../services/api-client.js';
import { CUSTOM_EMOJIS } from '../../constants/emojis.js';
import { requireMemberPermissions } from '../../guards/permissions.js';
import { embedField, errorEmbed, infoEmbed, successEmbed } from '../../utils/embeds.js';
import type { SlashCommand } from '../types.js';

export const settingsCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Manage server configuration')
    .setDefaultMemberPermissions(null)
    .addSubcommand((subcommand) =>
      subcommand.setName('info').setDescription('View current server settings'),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('prefix')
        .setDescription('View or change the command prefix')
        .addStringOption((option) =>
          option
            .setName('value')
            .setDescription('New prefix (1-10 characters)')
            .setRequired(false)
            .setMaxLength(10)
            .setMinLength(1),
        ),
    ),

  async execute(interaction, { apiClient, guildConfig }) {
    const guildId = await requireMemberPermissions(
      interaction,
      PermissionFlagsBits.ManageGuild,
      'Manage Server',
    );
    if (!guildId) return;

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'info') {
      await interaction.deferReply({ ephemeral: true });

      try {
        const guild = await guildConfig.refreshPrefix(guildId, apiClient);

        const embed = infoEmbed(
          `${CUSTOM_EMOJIS.servers} Server Settings`,
          'Current configuration for this server.',
        ).addFields(
          embedField('Guild ID', `\`${guild.id}\``, false),
          embedField('Command Prefix', `\`${guild.prefix}\``, false),
          embedField('Registered Since', `<t:${Math.floor(new Date(guild.createdAt).getTime() / 1000)}:R>`, false),
        );

        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Could not load server settings. Please try again later.';

        await interaction.editReply({ embeds: [errorEmbed('Settings unavailable', message)] });
      }

      return;
    }

    const newPrefix = interaction.options.getString('value');

    if (!newPrefix) {
      const currentPrefix = guildConfig.getPrefix(guildId);

      await interaction.reply({
        embeds: [
          infoEmbed(
            'Command Prefix',
            `The current prefix is \`${currentPrefix}\`.\nUse \`/settings prefix value:<prefix>\` to change it.`,
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const guild = await apiClient.updateGuild(guildId, { prefix: newPrefix });
      guildConfig.setPrefix(guildId, guild.prefix);

      await interaction.editReply({
        embeds: [
          successEmbed(
            'Prefix updated',
            `Command prefix changed to \`${guild.prefix}\`.\nExample: \`${guild.prefix}ping\``,
          ),
        ],
      });
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Could not update the command prefix. Please try again later.';

      await interaction.editReply({ embeds: [errorEmbed('Update failed', message)] });
    }
  },
};
