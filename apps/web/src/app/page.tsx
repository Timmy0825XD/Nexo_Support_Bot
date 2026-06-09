async function getApiHealth() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

  try {
    const res = await fetch(`${apiUrl}/health`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const health = await getApiHealth();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">MW Tournament Platform</h1>
        <p className="mt-2 text-slate-400">Team registration for Modern Warships tournaments</p>
      </div>

      <div className="w-full rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">System Status</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-400">API</dt>
            <dd className={health?.status === 'ok' ? 'text-green-400' : 'text-red-400'}>
              {health?.status ?? 'unreachable'}
            </dd>
          </div>
          {health?.database && (
            <div className="flex justify-between">
              <dt className="text-slate-400">Database</dt>
              <dd className={health.database === 'connected' ? 'text-green-400' : 'text-yellow-400'}>
                {health.database}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <p className="text-center text-sm text-slate-500">
        Registration pages will be available at{' '}
        <code className="rounded bg-slate-800 px-1.5 py-0.5">/register/[tournamentId]</code>
      </p>
    </main>
  );
}
