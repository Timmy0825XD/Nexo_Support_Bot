import {
  apiErrorSchema,
  guildResponseSchema,
  healthResponseSchema,
  registrationListResponseSchema,
  registrationResponseSchema,
  tournamentListResponseSchema,
  tournamentResponseSchema,
  type CreateTournamentInput,
  type GuildResponse,
  type RegistrationListResponse,
  type RegistrationResponse,
  type TournamentListResponse,
  type TournamentResponse,
  type UpdateGuildInput,
  type UpsertGuildInput,
  type ValidateRegistrationInput,
} from '@mw-platform/shared';

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function parseResponse<T>(
  response: Response,
  schema?: { safeParse: (data: unknown) => { success: boolean; data?: T } },
): Promise<T> {
  const text = await response.text();
  let data: unknown = null;

  if (text.trim()) {
    data = JSON.parse(text) as unknown;
  }

  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(data);
    const message = parsedError.success
      ? parsedError.data.error.message
      : `Request failed with status ${response.status}`;
    const code = parsedError.success ? parsedError.data.error.code : undefined;

    throw new ApiClientError(message, response.status, code);
  }

  if (schema) {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Invalid response from API');
    }
    return parsed.data as T;
  }

  return data as T;
}

export function createApiClient(baseUrl: string, apiKey: string) {
  const request = async <T>(
    path: string,
    options: RequestInit = {},
    schema?: { safeParse: (data: unknown) => { success: boolean; data?: T } },
  ) => {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...options.headers,
      },
      signal: options.signal ?? AbortSignal.timeout(5000),
    });

    return parseResponse<T>(response, schema);
  };

  return {
    async getHealth() {
      const data = await request('/health', {}, healthResponseSchema);
      return data as typeof data & { database?: string };
    },

    async getGuild(guildId: string) {
      return request<GuildResponse>(`/guilds/${guildId}`, { method: 'GET' }, guildResponseSchema);
    },

    async upsertGuild(guildId: string, input: UpsertGuildInput = {}) {
      return request<GuildResponse>(
        `/guilds/${guildId}`,
        {
          method: 'PUT',
          body: JSON.stringify(input),
        },
        guildResponseSchema,
      );
    },

    async updateGuild(guildId: string, input: UpdateGuildInput) {
      return request<GuildResponse>(
        `/guilds/${guildId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(input),
        },
        guildResponseSchema,
      );
    },

    async listTournaments(guildId: string) {
      return request<TournamentListResponse>(
        `/guilds/${guildId}/tournaments`,
        { method: 'GET' },
        tournamentListResponseSchema,
      );
    },

    async createTournament(guildId: string, input: CreateTournamentInput) {
      return request<TournamentResponse>(
        `/guilds/${guildId}/tournaments`,
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
        tournamentResponseSchema,
      );
    },

    async getTournament(tournamentId: string) {
      return request<TournamentResponse>(
        `/tournaments/${tournamentId}`,
        { method: 'GET' },
        tournamentResponseSchema,
      );
    },

    async deleteTournament(tournamentId: string) {
      await request(`/tournaments/${tournamentId}`, { method: 'DELETE' });
    },

    async openRegistration(tournamentId: string) {
      return request<TournamentResponse>(
        `/tournaments/${tournamentId}/registration/open`,
        { method: 'POST' },
        tournamentResponseSchema,
      );
    },

    async closeRegistration(tournamentId: string) {
      return request<TournamentResponse>(
        `/tournaments/${tournamentId}/registration/close`,
        { method: 'POST' },
        tournamentResponseSchema,
      );
    },

    async listRegistrations(tournamentId: string) {
      return request<RegistrationListResponse>(
        `/tournaments/${tournamentId}/registrations`,
        { method: 'GET' },
        registrationListResponseSchema,
      );
    },

    async validateRegistration(registrationId: string, input: ValidateRegistrationInput) {
      return request<RegistrationResponse>(
        `/registrations/${registrationId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(input),
        },
        registrationResponseSchema,
      );
    },
  };
}
