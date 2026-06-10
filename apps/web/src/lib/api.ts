import {
  apiErrorSchema,
  registrationResponseSchema,
  tournamentPublicResponseSchema,
  type RegistrationResponse,
  type SubmitRegistrationInput,
  type TournamentPublicResponse,
} from '@mw-platform/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

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

export async function getTournamentPublic(
  tournamentId: string,
): Promise<TournamentPublicResponse | null> {
  const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/public`, {
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }

  return parseResponse(response, tournamentPublicResponseSchema);
}

export async function submitRegistration(
  tournamentId: string,
  input: SubmitRegistrationInput,
): Promise<RegistrationResponse> {
  const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/registrations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseResponse(response, registrationResponseSchema);
}
