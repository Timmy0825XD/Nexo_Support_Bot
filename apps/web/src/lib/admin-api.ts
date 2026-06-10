import {
  apiErrorSchema,
  registrationListResponseSchema,
  registrationResponseSchema,
  type RegistrationListResponse,
  type RegistrationResponse,
  type UpdateRegistrationInput,
} from '@mw-platform/shared';

async function parseResponse<T>(
  response: Response,
  schema?: { safeParse: (data: unknown) => { success: boolean; data?: T } },
): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(data);
    const message = parsedError.success
      ? parsedError.data.error.message
      : typeof data === 'object' &&
          data !== null &&
          'error' in data &&
          typeof data.error === 'string'
        ? data.error
        : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  if (schema) {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Invalid response from admin API');
    }
    return parsed.data as T;
  }

  return data as T;
}

export async function listRegistrationsAdmin(
  tournamentId: string,
): Promise<RegistrationListResponse> {
  const response = await fetch(`/api/admin/tournaments/${tournamentId}/registrations`, {
    cache: 'no-store',
  });

  return parseResponse(response, registrationListResponseSchema);
}

export async function updateRegistrationAdmin(
  registrationId: string,
  input: UpdateRegistrationInput,
): Promise<RegistrationResponse> {
  const response = await fetch(`/api/admin/registrations/${registrationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseResponse(response, registrationResponseSchema);
}
