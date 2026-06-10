'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Atmosphere } from './ui/atmosphere';
import { inputClassName } from './ui/form-field';
import { Icon } from './ui/icon';

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('from') ?? '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        setError('Invalid username or password');
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Atmosphere />
      <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-12">
        <div className="glass-card w-full rounded-xl border-t-2 border-t-indigo-500/40 p-8">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-container/30">
              <Icon name="lock" className="text-3xl text-primary" />
            </div>
            <h1 className="text-page-title-mobile text-on-surface">Staff Access</h1>
            <p className="text-body-md mt-2 text-on-surface-variant">
              Sign in to manage tournament registrations.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-label-sm text-on-surface-variant block">Username</label>
              <input
                className={inputClassName()}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-label-sm text-on-surface-variant block">Password</label>
              <input
                type="password"
                className={inputClassName()}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error ? (
              <p className="flex items-center gap-2 text-sm text-red-400">
                <Icon name="error" className="text-sm" />
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-container px-4 py-3 font-bold text-on-primary-container transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Icon name="refresh" className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <Icon name="login" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
