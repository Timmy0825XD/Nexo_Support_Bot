import type { createApiClient } from '../../services/api-client.js';
import { toAutocompleteChoices } from '../utils.js';

type ApiClient = ReturnType<typeof createApiClient>;

export async function getTournamentChoices(
  guildId: string,
  apiClient: ApiClient,
  focus: string,
) {
  const { tournaments } = await apiClient.listTournaments(guildId);

  return toAutocompleteChoices(
    tournaments.map((tournament) => ({
      name: `${tournament.name} · ${tournament.format} · ${tournament.registrationOpen ? 'Open' : 'Closed'}`,
      value: tournament.id,
    })),
    focus,
  );
}
