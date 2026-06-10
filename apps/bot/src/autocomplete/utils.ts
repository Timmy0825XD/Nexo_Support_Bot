import type { ApplicationCommandOptionChoiceData } from 'discord.js';

export const AUTOCOMPLETE_MAX_CHOICES = 25;
export const CHOICE_NAME_MAX_LENGTH = 100;

export function matchesFocus(text: string, focus: string): boolean {
  if (!focus) return true;
  return text.toLowerCase().includes(focus.toLowerCase());
}

export function truncateChoiceName(name: string, max = CHOICE_NAME_MAX_LENGTH): string {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

export function toAutocompleteChoices(
  items: Array<{ name: string; value: string }>,
  focus: string,
): ApplicationCommandOptionChoiceData[] {
  return items
    .filter((item) => matchesFocus(item.name, focus))
    .slice(0, AUTOCOMPLETE_MAX_CHOICES)
    .map((item) => ({
      name: truncateChoiceName(item.name),
      value: item.value,
    }));
}
