import {
  CURRENT_TITLES,
  getParticipantCount,
  getParticipantRoleLabel,
  requiresManualTeamName,
  type CurrentTitle,
  type RegistrationResponse,
  type RegistrationStatus,
  type TournamentFormat,
  type UpdateRegistrationInput,
} from '@mw-platform/shared';

export interface TeamParticipant {
  slotIndex: number;
  role: string;
  discordTag: string;
  discordId: string;
  inGameName: string;
  inGameId: string;
  currentTitle: CurrentTitle;
}

export interface TeamSpreadsheetRow {
  key: string;
  registrationId: string;
  teamName: string;
  status: RegistrationStatus;
  flaggedForReview: boolean;
  createdAt: string;
  updatedAt: string;
  participants: TeamParticipant[];
}

export const PARTICIPANT_FIELD_DEFS = [
  { key: 'discordTag' as const, label: 'Discord Tag' },
  { key: 'discordId' as const, label: 'Discord ID' },
  { key: 'inGameName' as const, label: 'In-game Name' },
  { key: 'inGameId' as const, label: 'In-game ID' },
  { key: 'currentTitle' as const, label: 'Current Title' },
];

export function registrationsToTeamRows(
  registrations: RegistrationResponse[],
): TeamSpreadsheetRow[] {
  return registrations.map((registration) => ({
    key: registration.id,
    registrationId: registration.id,
    teamName: registration.teamName,
    status: registration.status,
    flaggedForReview: registration.flaggedForReview,
    createdAt: registration.createdAt,
    updatedAt: registration.updatedAt,
    participants: registration.participants.map((participant) => ({
      slotIndex: participant.slotIndex,
      role: getParticipantRoleLabel(participant.slotIndex),
      discordTag: participant.discordTag,
      discordId: participant.discordId,
      inGameName: participant.inGameName,
      inGameId: participant.inGameId,
      currentTitle: participant.currentTitle,
    })),
  }));
}

function normalizeDiscordTag(tag: string): string {
  return tag.trim().toLowerCase();
}

export function teamRowToRegistrationUpdate(
  row: TeamSpreadsheetRow,
  format: TournamentFormat,
): UpdateRegistrationInput {
  const expectedCount = getParticipantCount(format);
  const participantBySlot = new Map(row.participants.map((participant) => [participant.slotIndex, participant]));

  const participants = Array.from({ length: expectedCount }, (_, slotIndex) => {
    const participant = participantBySlot.get(slotIndex);

    return {
      discordTag: normalizeDiscordTag(participant?.discordTag ?? ''),
      discordId: (participant?.discordId ?? '').trim(),
      inGameName: (participant?.inGameName ?? '').trim(),
      inGameId: (participant?.inGameId ?? '').trim(),
      currentTitle: participant?.currentTitle ?? 'Untitled',
    };
  });

  const payload: UpdateRegistrationInput = {
    status: row.status,
    flaggedForReview: row.flaggedForReview,
    participants,
  };

  if (requiresManualTeamName(format)) {
    payload.teamName = row.teamName.trim();
  }

  return payload;
}

export function isTeamRowDirty(
  row: TeamSpreadsheetRow,
  baseline: TeamSpreadsheetRow | undefined,
) {
  if (!baseline) return true;

  if (
    row.teamName !== baseline.teamName ||
    row.status !== baseline.status ||
    row.flaggedForReview !== baseline.flaggedForReview
  ) {
    return true;
  }

  for (const participant of row.participants) {
    const original = baseline.participants.find((p) => p.slotIndex === participant.slotIndex);
    if (!original) return true;

    if (
      participant.discordTag !== original.discordTag ||
      participant.discordId !== original.discordId ||
      participant.inGameName !== original.inGameName ||
      participant.inGameId !== original.inGameId ||
      participant.currentTitle !== original.currentTitle
    ) {
      return true;
    }
  }

  return false;
}

/** Fixed format — avoids SSR/client locale hydration mismatch. */
export function formatDisplayDate(iso: string) {
  const date = new Date(iso);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
}

export { CURRENT_TITLES };
