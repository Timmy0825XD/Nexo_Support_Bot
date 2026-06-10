import { Icon } from './ui/icon';
import { Atmosphere } from './ui/atmosphere';

export function TournamentNotFound() {
  return (
    <>
      <Atmosphere />
      <main className="mx-auto flex min-h-screen max-w-[672px] flex-col items-center justify-center px-4 pb-24">
        <section className="flex min-h-[300px] flex-col items-center justify-center space-y-6 border-t-2 border-t-indigo-500/40 text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl" />
            <Icon name="search_off" className="relative z-10 text-8xl text-slate-700" />
          </div>
          <div className="space-y-2">
            <h1 className="text-page-title-mobile text-on-surface">Tournament not found</h1>
            <p className="text-body-md mx-auto max-w-xs text-slate-500">
              We couldn&apos;t locate the event you&apos;re looking for. It may have been moved or
              the link is expired.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

interface RegistrationClosedProps {
  tournamentName: string;
}

export function RegistrationClosed({ tournamentName }: RegistrationClosedProps) {
  return (
    <>
      <Atmosphere />
      <main className="mx-auto flex min-h-screen max-w-[672px] items-center justify-center px-4 pb-24">
        <section className="relative w-full overflow-hidden rounded-xl border border-outline-variant border-t-2 border-t-indigo-500/40 bg-surface/60 p-8 backdrop-blur-xl">
          <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-error/5 blur-2xl" />
          <div className="relative flex flex-col items-center space-y-4 text-center">
            <div className="rounded-full bg-error/10 p-4">
              <Icon name="lock_clock" className="text-4xl text-error" />
            </div>
            <div className="space-y-2">
              <h1 className="text-section-title text-on-surface">
                Registration is currently closed
              </h1>
              <p className="text-body-md text-on-surface-variant">
                The signup window for{' '}
                <span className="font-bold text-primary">{tournamentName}</span> has ended.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
