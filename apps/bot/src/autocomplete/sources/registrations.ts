import type { createApiClient } from '../../services/api-client.js';
import { toAutocompleteChoices } from '../utils.js';

type ApiClient = ReturnType<typeof createApiClient>;

export async function getRegistrationChoices(
  tournamentId: string,
  apiClient: ApiClient,
  focus: string,
) {
  const { registrations } = await apiClient.listRegistrations(tournamentId);

  return toAutocompleteChoices(
    registrations.map((registration) => {
      const captain = registration.participants.find((participant) => participant.slotIndex === 0);
      const captainName = captain?.inGameName ?? 'Unknown captain';
      const flag = registration.flaggedForReview ? ' 🚩' : '';

      return {
        name: `${registration.teamName} · ${captainName} · ${registration.status}${flag}`,
        value: registration.id,
      };
    }),
    focus,
  );
}
