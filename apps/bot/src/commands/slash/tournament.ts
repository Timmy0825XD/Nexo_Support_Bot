import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type SlashCommandStringOption,
} from 'discord.js';
import { TOURNAMENT_FORMATS } from '@mw-platform/shared';
import { getRegistrationChoices } from '../../autocomplete/sources/registrations.js';
import { getTournamentChoices } from '../../autocomplete/sources/tournaments.js';
import { ApiClientError } from '../../services/api-client.js';
import { CUSTOM_EMOJIS } from '../../constants/emojis.js';
import { requireMemberPermissions } from '../../guards/permissions.js';
import { embedField, errorEmbed, infoEmbed, successEmbed } from '../../utils/embeds.js';
import type { SlashCommand } from '../types.js';

const registerBaseUrl = process.env.REGISTER_BASE_URL ?? 'http://localhost:3001/register';
const webBaseUrl = process.env.WEB_BASE_URL ?? 'http://localhost:3001';

function tournamentOption(option: SlashCommandStringOption) {
  return option
    .setName('tournament')
    .setDescription('Select a tournament')
    .setRequired(true)
    .setAutocomplete(true);
}

function registrationOption(option: SlashCommandStringOption) {
  return option
    .setName('registration')
    .setDescription('Select a registration')
    .setRequired(true)
    .setAutocomplete(true);
}

function registrationUrl(tournamentId: string) {
  return `${registerBaseUrl}/${tournamentId}`;
}

function managementUrl(tournamentId: string) {
  return `${webBaseUrl}/tournaments/${tournamentId}/registrations`;
}

function markdownLink(label: string, url: string) {
  return `[${label}](${url})`;
}

function mapApiError(error: unknown, fallback: string) {
  return error instanceof ApiClientError ? error.message : fallback;
}

export const tournamentCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('tournament')
    .setDescription('Manage tournaments and registration')
    .setDefaultMemberPermissions(null)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Create a new tournament')
        .addStringOption((option) =>
          option.setName('name').setDescription('Tournament name').setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('format')
            .setDescription('Tournament format')
            .setRequired(true)
            .addChoices(
              ...TOURNAMENT_FORMATS.map((format) => ({ name: format, value: format })),
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('list').setDescription('List tournaments in this server'),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('delete')
        .setDescription('Delete a tournament')
        .addStringOption(tournamentOption),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('info')
        .setDescription('View tournament details')
        .addStringOption(tournamentOption),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('registration-open')
        .setDescription('Open registration for a tournament')
        .addStringOption(tournamentOption),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('registration-close')
        .setDescription('Close registration for a tournament')
        .addStringOption(tournamentOption),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('registration-list')
        .setDescription('List registrations for a tournament')
        .addStringOption(tournamentOption),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('registration-validate')
        .setDescription('Confirm or reject a registration')
        .addStringOption(tournamentOption)
        .addStringOption(registrationOption)
        .addStringOption((option) =>
          option
            .setName('status')
            .setDescription('Validation result')
            .setRequired(true)
            .addChoices(
              { name: 'Confirm', value: 'confirmed' },
              { name: 'Reject', value: 'rejected' },
            ),
        ),
    ),

  async autocomplete(interaction, { apiClient }) {
    if (!interaction.guildId) {
      await interaction.respond([]);
      return;
    }

    const focused = interaction.options.getFocused(true);

    try {
      if (focused.name === 'tournament') {
        const choices = await getTournamentChoices(interaction.guildId, apiClient, focused.value);
        await interaction.respond(choices);
        return;
      }

      if (focused.name === 'registration') {
        const tournamentId = interaction.options.getString('tournament');

        if (!tournamentId) {
          await interaction.respond([]);
          return;
        }

        const choices = await getRegistrationChoices(tournamentId, apiClient, focused.value);
        await interaction.respond(choices);
        return;
      }

      await interaction.respond([]);
    } catch (error) {
      console.error('Tournament autocomplete failed:', error);
      await interaction.respond([]);
    }
  },

  async execute(interaction, { apiClient }) {
    const guildId = await requireMemberPermissions(
      interaction,
      PermissionFlagsBits.Administrator,
      'Administrator',
    );
    if (!guildId) return;

    const subcommand = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    try {
      switch (subcommand) {
        case 'add': {
          const name = interaction.options.getString('name', true);
          const format = interaction.options.getString('format', true) as (typeof TOURNAMENT_FORMATS)[number];

          const tournament = await apiClient.createTournament(guildId, { name, format });

          await interaction.editReply({
            embeds: [
              successEmbed(
                'Tournament created',
                `**${tournament.name}** (${tournament.format}) is ready.`,
              ).addFields(
                embedField('Tournament ID', `\`${tournament.id}\``, false),
                embedField(
                  'Registration URL',
                  registrationOpenLabel(tournament.registrationOpen, tournament.id),
                  false,
                ),
              ),
            ],
          });
          break;
        }

        case 'list': {
          const { tournaments } = await apiClient.listTournaments(guildId);

          if (tournaments.length === 0) {
            await interaction.editReply({
              embeds: [infoEmbed('No tournaments', 'This server has no tournaments yet.')],
            });
            return;
          }

          const lines = tournaments.map(
            (tournament) =>
              `**${tournament.name}** (\`${tournament.format}\`)\nID: \`${tournament.id}\` · Registration: ${tournament.registrationOpen ? 'Open' : 'Closed'}`,
          );

          await interaction.editReply({
            embeds: [
              infoEmbed(`${CUSTOM_EMOJIS.servers} Tournaments`, lines.join('\n\n')).addFields(
                embedField('Total', `\`${tournaments.length}\``, true),
              ),
            ],
          });
          break;
        }

        case 'delete': {
          const tournamentId = interaction.options.getString('tournament', true);
          const tournament = await apiClient.getTournament(tournamentId);
          await apiClient.deleteTournament(tournamentId);

          await interaction.editReply({
            embeds: [
              successEmbed(
                'Tournament deleted',
                `**${tournament.name}** was removed from this server.`,
              ),
            ],
          });
          break;
        }

        case 'info': {
          const tournamentId = interaction.options.getString('tournament', true);
          const tournament = await apiClient.getTournament(tournamentId);

          await interaction.editReply({
            embeds: [
              infoEmbed(tournament.name, `Format: **${tournament.format}**`).addFields(
                embedField('Tournament ID', `\`${tournament.id}\``, false),
                embedField(
                  'Registration',
                  tournament.registrationOpen ? '`Open`' : '`Closed`',
                  true,
                ),
                embedField(
                  'Registration URL',
                  registrationOpenLabel(tournament.registrationOpen, tournament.id),
                  false,
                ),
                embedField(
                  'Registration Manager',
                  markdownLink('Open spreadsheet', managementUrl(tournament.id)),
                  false,
                ),
              ),
            ],
          });
          break;
        }

        case 'registration-open': {
          const tournamentId = interaction.options.getString('tournament', true);
          const tournament = await apiClient.openRegistration(tournamentId);

          await interaction.editReply({
            embeds: [
              successEmbed(
                'Registration opened',
                `Registration is now open for **${tournament.name}**.`,
              ).addFields(
                embedField(
                  'URL',
                  markdownLink('Public registration', registrationUrl(tournament.id)),
                  false,
                ),
                embedField(
                  'Manager',
                  markdownLink('Open spreadsheet', managementUrl(tournament.id)),
                  false,
                ),
              ),
            ],
          });
          break;
        }

        case 'registration-close': {
          const tournamentId = interaction.options.getString('tournament', true);
          const tournament = await apiClient.closeRegistration(tournamentId);

          await interaction.editReply({
            embeds: [
              successEmbed(
                'Registration closed',
                `Registration is now closed for **${tournament.name}**.`,
              ),
            ],
          });
          break;
        }

        case 'registration-list': {
          const tournamentId = interaction.options.getString('tournament', true);
          const tournament = await apiClient.getTournament(tournamentId);
          const { registrations } = await apiClient.listRegistrations(tournamentId);

          if (registrations.length === 0) {
            await interaction.editReply({
              embeds: [
                infoEmbed(
                  'No registrations',
                  `No registrations submitted yet for **${tournament.name}**.`,
                ),
              ],
            });
            return;
          }

          const lines = registrations.slice(0, 10).map((registration) => {
            const captain = registration.participants.find((participant) => participant.slotIndex === 0);
            const flag = registration.flaggedForReview ? ' 🚩' : '';
            return `**${registration.teamName}** · ${captain?.inGameName ?? 'Unknown'} · \`${registration.status}\`${flag}`;
          });

          await interaction.editReply({
            embeds: [
              infoEmbed(`Registrations — ${tournament.name}`, lines.join('\n')).addFields(
                embedField(
                  'Shown',
                  `\`${Math.min(registrations.length, 10)}\` of \`${registrations.length}\``,
                  true,
                ),
              ),
            ],
          });
          break;
        }

        case 'registration-validate': {
          const registrationId = interaction.options.getString('registration', true);
          const status = interaction.options.getString('status', true) as 'confirmed' | 'rejected';

          const registration = await apiClient.validateRegistration(registrationId, { status });
          const captain = registration.participants.find((participant) => participant.slotIndex === 0);

          await interaction.editReply({
            embeds: [
              successEmbed(
                'Registration updated',
                `**${registration.teamName}** is now \`${registration.status}\`.`,
              ),
            ],
          });
          break;
        }
      }
    } catch (error) {
      await interaction.editReply({
        embeds: [errorEmbed('Command failed', mapApiError(error, 'Could not complete this action.'))],
      });
    }
  },
};

function registrationOpenLabel(open: boolean, tournamentId: string) {
  return open
    ? markdownLink('Public registration', registrationUrl(tournamentId))
    : '_Open registration to generate the public URL._';
}
