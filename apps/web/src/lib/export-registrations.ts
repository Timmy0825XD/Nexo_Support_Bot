import { getParticipantCount, type TournamentFormat } from '@mw-platform/shared';
import * as XLSX from 'xlsx-js-style';
import {
  formatDisplayDate,
  PARTICIPANT_FIELD_DEFS,
  type TeamSpreadsheetRow,
} from './registration-rows';

type CellStyle = XLSX.CellStyle;

const HEADER_STYLES = {
  team: { bg: '4F46E5', fg: 'FFFFFF' },
  captain: { bg: '3730A3', fg: 'E0E7FF' },
  player: { bg: '312E81', fg: 'DDD6FE' },
  meta: { bg: '1E1B4B', fg: 'C7D2FE' },
} as const;

const ROW_STYLES = {
  odd: { bg: 'FFFFFF', fg: '1E1B4B' },
  even: { bg: 'EEF2FF', fg: '1E1B4B' },
} as const;

const BORDER_COLOR = 'C7D2FE';

function buildHeaders(format: TournamentFormat): string[] {
  const participantCount = getParticipantCount(format);
  const headers = ['Team Name', 'Status', 'Flagged for Review'];

  for (let i = 0; i < participantCount; i++) {
    const label = i === 0 ? 'Captain' : `Player ${i}`;
    for (const field of PARTICIPANT_FIELD_DEFS) {
      headers.push(`${label} ${field.label}`);
    }
  }

  headers.push('Registered At', 'Last Modified');
  return headers;
}

function getHeaderGroup(
  columnIndex: number,
  format: TournamentFormat,
): keyof typeof HEADER_STYLES {
  const teamCols = 3;
  const fieldsPerParticipant = PARTICIPANT_FIELD_DEFS.length;
  const participantCount = getParticipantCount(format);
  const participantColsEnd = teamCols + participantCount * fieldsPerParticipant;

  if (columnIndex < teamCols) return 'team';
  if (columnIndex < participantColsEnd) {
    const participantIndex = Math.floor((columnIndex - teamCols) / fieldsPerParticipant);
    return participantIndex === 0 ? 'captain' : 'player';
  }
  return 'meta';
}

function makeBorder(): CellStyle['border'] {
  return {
    top: { style: 'thin', color: { rgb: BORDER_COLOR } },
    bottom: { style: 'thin', color: { rgb: BORDER_COLOR } },
    left: { style: 'thin', color: { rgb: BORDER_COLOR } },
    right: { style: 'thin', color: { rgb: BORDER_COLOR } },
  };
}

function makeHeaderStyle(group: keyof typeof HEADER_STYLES): CellStyle {
  const palette = HEADER_STYLES[group];
  return {
    fill: { patternType: 'solid', fgColor: { rgb: palette.bg } },
    font: { bold: true, color: { rgb: palette.fg }, sz: 11 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      bottom: { style: 'medium', color: { rgb: '312E81' } },
      top: { style: 'thin', color: { rgb: '312E81' } },
      left: { style: 'thin', color: { rgb: '312E81' } },
      right: { style: 'thin', color: { rgb: '312E81' } },
    },
  };
}

function makeDataStyle(isEvenRow: boolean): CellStyle {
  const palette = isEvenRow ? ROW_STYLES.even : ROW_STYLES.odd;
  return {
    fill: { patternType: 'solid', fgColor: { rgb: palette.bg } },
    font: { color: { rgb: palette.fg }, sz: 10 },
    alignment: { vertical: 'center', wrapText: false },
    border: makeBorder(),
  };
}

function columnWidthFor(header: string, values: string[]): number {
  const maxLen = Math.max(header.length, ...values.map((v) => v.length));
  return Math.min(Math.max(maxLen + 2, 12), 42);
}

function applyWorksheetStyles(
  worksheet: XLSX.WorkSheet,
  headers: string[],
  dataRows: string[][],
  format: TournamentFormat,
): void {
  const range = XLSX.utils.decode_range(worksheet['!ref'] ?? 'A1');

  for (let c = range.s.c; c <= range.e.c; c++) {
    const address = XLSX.utils.encode_cell({ r: 0, c });
    const cell = worksheet[address];
    if (!cell) continue;
    const group = getHeaderGroup(c, format);
    cell.s = makeHeaderStyle(group);
  }

  for (let r = 1; r <= range.e.r; r++) {
    const isEvenRow = r % 2 === 0;
    const style = makeDataStyle(isEvenRow);
    for (let c = range.s.c; c <= range.e.c; c++) {
      const address = XLSX.utils.encode_cell({ r, c });
      if (!worksheet[address]) {
        worksheet[address] = { t: 's', v: '' };
      }
      worksheet[address].s = style;
    }
  }

  worksheet['!cols'] = headers.map((header, index) => ({
    wch: columnWidthFor(
      header,
      dataRows.map((row) => row[index] ?? ''),
    ),
  }));

  worksheet['!rows'] = [{ hpt: 32 }];
  worksheet['!views'] = [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }];
}

function buildDataRows(rows: TeamSpreadsheetRow[]): string[][] {
  return rows.map((row) => {
    const values: string[] = [
      row.teamName,
      row.status,
      row.flaggedForReview ? 'Yes' : 'No',
    ];

    for (const participant of row.participants) {
      values.push(
        participant.discordTag,
        participant.discordId,
        participant.inGameName,
        participant.inGameId,
        participant.currentTitle,
      );
    }

    values.push(formatDisplayDate(row.createdAt), formatDisplayDate(row.updatedAt));
    return values;
  });
}

export function exportRegistrationsToExcel(
  rows: TeamSpreadsheetRow[],
  tournamentName: string,
  format: TournamentFormat,
): void {
  const headers = buildHeaders(format);
  const dataRows = buildDataRows(rows);
  const sheetData = [headers, ...dataRows];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  applyWorksheetStyles(worksheet, headers, dataRows, format);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

  const safeName = tournamentName.replace(/[^\w\s-]/g, '').trim() || 'tournament';
  XLSX.writeFile(workbook, `${safeName}-registrations.xlsx`);
}
