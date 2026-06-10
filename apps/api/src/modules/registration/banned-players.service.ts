import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  getParticipantFieldLabel,
  type ParticipantInput,
} from '@mw-platform/shared';

interface BannedLists {
  discordIds: Set<string>;
  inGameIds: Set<string>;
}

@Injectable()
export class BannedPlayersService {
  private readonly logger = new Logger(BannedPlayersService.name);
  private cache: BannedLists | null = null;
  private cacheExpiresAt = 0;
  private readonly cacheTtlMs = 5 * 60 * 1000;

  constructor(private readonly configService: ConfigService) {}

  async findBannedParticipant(
    participants: ParticipantInput[],
  ): Promise<{ fieldLabel: string } | null> {
    const sheetUrl = this.configService.get<string>('BANNED_PLAYERS_SHEET_URL');

    if (!sheetUrl?.trim()) {
      return null;
    }

    const banned = await this.loadBannedLists(sheetUrl);

    for (let slotIndex = 0; slotIndex < participants.length; slotIndex++) {
      const participant = participants[slotIndex];

      if (banned.discordIds.has(participant.discordId.trim())) {
        return { fieldLabel: getParticipantFieldLabel(slotIndex, 'Discord ID') };
      }

      if (banned.inGameIds.has(normalizeInGameId(participant.inGameId))) {
        return { fieldLabel: getParticipantFieldLabel(slotIndex, 'In-game ID') };
      }
    }

    return null;
  }

  private async loadBannedLists(sheetUrl: string): Promise<BannedLists> {
    const now = Date.now();

    if (this.cache && now < this.cacheExpiresAt) {
      return this.cache;
    }

    const csvUrl = resolveGoogleSheetCsvUrl(sheetUrl);

    try {
      const response = await fetch(csvUrl, { signal: AbortSignal.timeout(10000) });

      if (!response.ok) {
        throw new Error(`Sheet fetch failed: ${response.status}`);
      }

      const csv = await response.text();

      if (csv.trim().startsWith('<!DOCTYPE') || csv.trim().startsWith('<html')) {
        throw new Error(
          'Sheet response was HTML, not CSV. Use a Google Sheets link or CSV export URL.',
        );
      }

      const lists = this.parseCsv(csv);

      this.cache = lists;
      this.cacheExpiresAt = now + this.cacheTtlMs;

      this.logger.log(
        `Loaded ${lists.inGameIds.size} banned in-game ID(s) and ${lists.discordIds.size} banned Discord ID(s)`,
      );

      return lists;
    } catch (error) {
      this.logger.warn(
        `Could not load banned players sheet: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      return { discordIds: new Set(), inGameIds: new Set() };
    }
  }

  private parseCsv(csv: string): BannedLists {
    const rows = parseCsvRows(csv);

    if (rows.length === 0) {
      return { discordIds: new Set(), inGameIds: new Set() };
    }

    const headers = rows[0].map((header) => header.trim().toLowerCase());
    const discordIndex = headers.findIndex((header) => header.includes('discord'));
    const inGameIndex = headers.findIndex(
      (header) =>
        header.includes('in_game') ||
        header.includes('ingame') ||
        header.includes('game_id') ||
        header.includes('game id') ||
        header.includes('player id') ||
        header === 'id' ||
        header.includes('uid'),
    );

    const discordIds = new Set<string>();
    const inGameIds = new Set<string>();

    for (const columns of rows.slice(1)) {
      if (discordIndex >= 0 && columns[discordIndex]) {
        const value = columns[discordIndex].trim();
        if (value && !looksLikeHeaderValue(value)) {
          discordIds.add(value);
        }
      }

      if (inGameIndex >= 0 && columns[inGameIndex]) {
        const value = columns[inGameIndex].trim();
        if (value && !looksLikeHeaderValue(value)) {
          inGameIds.add(normalizeInGameId(value));
        }
      }

      if (discordIndex < 0 && inGameIndex < 0) {
        const value = columns[0]?.trim();
        if (!value || looksLikeHeaderValue(value)) continue;

        if (/^\d{17,20}$/.test(value)) {
          discordIds.add(value);
        } else {
          inGameIds.add(normalizeInGameId(value));
        }
      }
    }

    return { discordIds, inGameIds };
  }
}

function normalizeInGameId(id: string): string {
  return id.trim().toLowerCase();
}

function looksLikeHeaderValue(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    lower.includes('discord') ||
    lower.includes('game id') ||
    lower === 'id' ||
    lower === 'uid' ||
    lower === 'player id'
  );
}

function resolveGoogleSheetCsvUrl(url: string): string {
  const trimmed = url.trim();

  if (trimmed.includes('/export?') && trimmed.includes('format=csv')) {
    return trimmed;
  }

  const sheetIdMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!sheetIdMatch) {
    return trimmed;
  }

  const sheetId = sheetIdMatch[1];
  const gidMatch = trimmed.match(/[?#&]gid=(\d+)/);
  const gidQuery = gidMatch ? `&gid=${gidMatch[1]}` : '';

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidQuery}`;
}

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < csv.length; index++) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (!inQuotes && (char === '\n' || (char === '\r' && next === '\n'))) {
      row.push(field);
      field = '';
      if (row.some((column) => column.trim().length > 0)) {
        rows.push(row);
      }
      row = [];
      if (char === '\r') index++;
      continue;
    }

    if (!inQuotes && char === '\r') {
      row.push(field);
      field = '';
      if (row.some((column) => column.trim().length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((column) => column.trim().length > 0)) {
    rows.push(row);
  }

  return rows;
}
