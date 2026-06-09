import { pingPrefixCommand } from './prefix/ping.js';
import { pingCommand } from './slash/ping.js';
import { settingsCommand } from './slash/settings.js';
import type { PrefixCommand, SlashCommand } from './types.js';

export function loadSlashCommands(): SlashCommand[] {
  return [pingCommand, settingsCommand];
}

export function loadPrefixCommands(): PrefixCommand[] {
  return [pingPrefixCommand];
}
