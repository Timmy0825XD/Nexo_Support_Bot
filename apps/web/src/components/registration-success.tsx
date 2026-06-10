import { Icon } from './ui/icon';

interface RegistrationSuccessProps {
  tournamentName: string;
}

export function RegistrationSuccess({ tournamentName }: RegistrationSuccessProps) {
  return (
    <div className="w-full rounded-xl border border-tertiary/20 border-t-2 border-t-indigo-500/40 bg-surface-container/60 p-8 text-center backdrop-blur-xl success-card-glow md:p-12">
      <div className="relative mb-8 inline-flex items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-tertiary/10 opacity-20" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-tertiary/30 bg-tertiary-container/30">
          <Icon name="check_circle" className="text-5xl text-tertiary" />
        </div>
      </div>

      <div className="mb-10 space-y-4">
        <h2 className="text-page-title-mobile md:text-page-title tracking-tight text-on-surface">
          Registration submitted
        </h2>
        <p className="text-body-md mx-auto max-w-md text-on-surface-variant">
          Your registration for{' '}
          <span className="font-semibold text-tertiary">{tournamentName}</span> is pending staff
          review. You will receive a notification once your team&apos;s eligibility is confirmed.
        </p>
      </div>

      <div className="grid w-full grid-cols-2 gap-4 opacity-60">
        <div className="flex items-center gap-3 rounded-lg border border-outline-variant/20 bg-surface-container/40 p-4">
          <Icon name="schedule" className="text-primary" />
          <div className="flex flex-col text-left">
            <span className="text-hint-xs text-on-surface-variant uppercase">Estimated Review</span>
            <span className="text-label-sm text-on-surface">2-4 Hours</span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-outline-variant/20 bg-surface-container/40 p-4">
          <Icon name="mail" className="text-primary" />
          <div className="flex flex-col text-left">
            <span className="text-hint-xs text-on-surface-variant uppercase">Contact Support</span>
            <span className="text-label-sm text-on-surface">Discord Ticket</span>
          </div>
        </div>
      </div>
    </div>
  );
}
