import type { ChatInputCommandInteraction, PermissionResolvable } from 'discord.js';
import { errorEmbed } from '../utils/embeds.js';

export async function requireMemberPermissions(
  interaction: ChatInputCommandInteraction,
  permissions: PermissionResolvable,
  permissionLabel: string,
): Promise<string | null> {
  const guildId = interaction.guildId;

  if (!guildId) {
    await interaction.reply({
      embeds: [errorEmbed('Guild only', 'This command can only be used inside a server.')],
      ephemeral: true,
    });
    return null;
  }

  if (!interaction.memberPermissions?.has(permissions)) {
    await interaction.reply({
      embeds: [
        errorEmbed(
          'Permission denied',
          `You need the **${permissionLabel}** permission to run this command.`,
        ),
      ],
      ephemeral: true,
    });
    return null;
  }

  return guildId;
}
