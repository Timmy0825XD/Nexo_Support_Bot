import 'dotenv/config';
import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
} from 'discord.js';
import { loadPrefixCommands, loadSlashCommands } from './commands/loader.js';
import type { PrefixCommand, SlashCommand } from './commands/types.js';
import { createApiClient } from './services/api-client.js';
import { GuildConfigCache } from './services/guild-config.js';
import { waitForApi } from './services/wait-for-api.js';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token || !clientId) {
  console.error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in environment');
  process.exit(1);
}

const apiClient = createApiClient(process.env.API_BASE_URL ?? 'http://localhost:3000/api');
const guildConfig = new GuildConfigCache();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const slashCommands = new Collection<string, SlashCommand>();
const prefixCommands = new Collection<string, PrefixCommand>();

for (const command of loadSlashCommands()) {
  slashCommands.set(command.data.name, command);
}

for (const command of loadPrefixCommands()) {
  prefixCommands.set(command.name, command);
}

const commandContext = { apiClient, guildConfig };

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Bot logged in as ${readyClient.user.tag}`);

  try {
    await waitForApi(apiClient);
    const guildIds = [...readyClient.guilds.cache.keys()];
    await guildConfig.syncAllGuilds(guildIds, apiClient);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Guild sync skipped: ${message}`);
    console.warn('Bot will keep running; retry with /settings or restart once API is up.');
  }

  const rest = new REST().setToken(token);
  const commandData = loadSlashCommands().map((cmd) => cmd.data.toJSON());

  try {
    await rest.put(Routes.applicationCommands(clientId), { body: commandData });
    console.log(`Registered ${commandData.length} slash command(s)`);
  } catch (error) {
    console.error('Failed to register slash commands:', error);
  }
});

client.on(Events.GuildCreate, async (guild) => {
  await guildConfig.ensureGuild(guild.id, apiClient);
  console.log(`Registered guild: ${guild.name} (${guild.id})`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = slashCommands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, commandContext);
  } catch (error) {
    console.error(`Error executing /${interaction.commandName}:`, error);

    const message = 'Something went wrong while executing this command.';
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: message, ephemeral: true });
    } else {
      await interaction.reply({ content: message, ephemeral: true });
    }
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guildId) return;

  const prefix = guildConfig.getPrefix(message.guildId);
  if (!message.content.startsWith(prefix)) return;

  const input = message.content.slice(prefix.length).trim();
  if (!input) return;

  const [commandName, ...args] = input.split(/\s+/);
  const command = prefixCommands.get(commandName.toLowerCase());
  if (!command) return;

  try {
    await command.execute(message, args, commandContext);
  } catch (error) {
    console.error(`Error executing ${prefix}${commandName}:`, error);
    await message.reply('Something went wrong while executing this command.');
  }
});

client.login(token);
