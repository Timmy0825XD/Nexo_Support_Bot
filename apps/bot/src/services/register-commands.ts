import { REST, Routes, type RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';

interface RegisterCommandsOptions {
  token: string;
  clientId: string;
  guildId?: string;
  commands: RESTPostAPIChatInputApplicationCommandsJSONBody[];
}

export async function registerSlashCommands({
  token,
  clientId,
  guildId,
  commands,
}: RegisterCommandsOptions) {
  const rest = new REST().setToken(token);
  const commandNames = commands.map((command) => command.name).join(', ');

  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log(
      `Registered ${commands.length} guild slash command(s) for ${guildId}: ${commandNames}`,
    );
    console.log('Guild commands update instantly in Discord.');

    await rest.put(Routes.applicationCommands(clientId), { body: [] });
    console.log('Cleared global slash commands to avoid duplicates during development.');
    return;
  }

  await rest.put(Routes.applicationCommands(clientId), { body: commands });
  console.log(`Registered ${commands.length} global slash command(s): ${commandNames}`);
  console.log('Global commands may take up to 1 hour to appear everywhere in Discord.');
}
