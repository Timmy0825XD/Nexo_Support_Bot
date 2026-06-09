import {
  apiErrorSchema,
  guildResponseSchema,
  healthResponseSchema,
  type GuildResponse,
  type UpdateGuildInput,
  type UpsertGuildInput,
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
  const data = await response.json();

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

export function createApiClient(baseUrl: string) {
  const request = async <T>(
    path: string,
    options: RequestInit = {},
    schema?: { safeParse: (data: unknown) => { success: boolean; data?: T } },
  ) => {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
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
  };
}
