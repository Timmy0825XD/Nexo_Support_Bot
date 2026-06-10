import { updateRegistrationSchema, type UpdateRegistrationInput } from '@mw-platform/shared';
import { NextResponse } from 'next/server';
import { updateRegistration } from '../../../../../lib/api-server';
import { requireAdminSession } from '../../../../../lib/require-admin-session';

interface RouteContext {
  params: Promise<{ registrationId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { registrationId } = await context.params;

  let body: UpdateRegistrationInput;
  try {
    const json = await request.json();
    const parsed = updateRegistrationSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    body = parsed.data;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const data = await updateRegistration(registrationId, body);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update registration.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
