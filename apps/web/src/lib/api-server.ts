import {
  apiErrorSchema,
  registrationListResponseSchema,
  registrationResponseSchema,
  tournamentResponseSchema,
  type RegistrationListResponse,
  type RegistrationResponse,
  type TournamentResponse,
  type UpdateRegistrationInput,
} from '@mw-platform/shared';

const API_BASE_URL = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

function getInternalApiKey() {
  const apiKey = process.env.INTERNAL_API_KEY;

  if (!apiKey) {
    throw new Error('INTERNAL_API_KEY is not configured');
  }

  return apiKey;
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

    throw new Error(message);
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

async function internalRequest<T>(
  path: string,
  options: RequestInit = {},
  schema?: { safeParse: (data: unknown) => { success: boolean; data?: T } },
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getInternalApiKey()}`,
      ...options.headers,
    },
  });

  return parseResponse<T>(response, schema);
}

export async function getTournament(tournamentId: string): Promise<TournamentResponse | null> {
  const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}`, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${getInternalApiKey()}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  return parseResponse(response, tournamentResponseSchema);
}

export async function listRegistrations(tournamentId: string): Promise<RegistrationListResponse> {
  return internalRequest(
    `/tournaments/${tournamentId}/registrations`,
    { method: 'GET' },
    registrationListResponseSchema,
  );
}

export async function updateRegistration(
  registrationId: string,
  input: UpdateRegistrationInput,
): Promise<RegistrationResponse> {
  return internalRequest(
    `/registrations/${registrationId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
    registrationResponseSchema,
  );
}
