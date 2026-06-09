import type { SlashCommand } from './types.js';
import { pingCommand } from './slash/ping.js';

export function loadSlashCommands(): SlashCommand[] {
  return [pingCommand];
}
