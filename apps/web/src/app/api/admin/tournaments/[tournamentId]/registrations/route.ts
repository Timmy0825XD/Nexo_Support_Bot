import { NextResponse } from 'next/server';
import { listRegistrations } from '../../../../../../lib/api-server';
import { requireAdminSession } from '../../../../../../lib/require-admin-session';

interface RouteContext {
  params: Promise<{ tournamentId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tournamentId } = await context.params;

  try {
    const data = await listRegistrations(tournamentId);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load registrations.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
