import 'dotenv/config';
import { Client, Collection, Events, GatewayIntentBits, REST, Routes } from 'discord.js';
import { loadSlashCommands } from './commands/loader.js';
import type { SlashCommand } from './commands/types.js';
import { createApiClient } from './services/api-client.js';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token || !clientId) {
  console.error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in environment');
  process.exit(1);
}

const apiClient = createApiClient(process.env.API_BASE_URL ?? 'http://localhost:3000/api');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const commands = new Collection<string, SlashCommand>();
const slashCommands = loadSlashCommands();

for (const command of slashCommands) {
  commands.set(command.data.name, command);
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Bot logged in as ${readyClient.user.tag}`);

  const rest = new REST().setToken(token);
  const commandData = slashCommands.map((cmd) => cmd.data.toJSON());

  try {
    await rest.put(Routes.applicationCommands(clientId), { body: commandData });
    console.log(`Registered ${commandData.length} slash command(s)`);
  } catch (error) {
    console.error('Failed to register slash commands:', error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, { apiClient });
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

client.login(token);
