import { Icon } from './ui/icon';

interface RegistrationManagerEmptyProps {
  onRefresh?: () => void;
}

export function RegistrationManagerEmpty({ onRefresh }: RegistrationManagerEmptyProps) {
  return (
    <div className="glass-card w-full rounded-xl p-10 text-center">
      <div className="relative mb-6 inline-flex">
        <div className="absolute inset-0 rounded-full bg-primary-container opacity-20 blur-2xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-outline-variant bg-surface-container-highest">
          <Icon name="groups" className="text-4xl text-primary" />
        </div>
      </div>

      <h2 className="text-page-title-mobile text-on-surface">No registrations yet</h2>
      <p className="text-body-md mx-auto mt-2 max-w-sm text-on-surface-variant">
        Registration hasn&apos;t opened yet or no teams have applied to this event.
      </p>

      {onRefresh ? (
        <button
          type="button"
          onClick={onRefresh}
          className="text-label-sm mt-6 inline-flex items-center gap-2 rounded-lg border border-outline-variant px-6 py-3 text-on-surface transition-all hover:bg-surface-variant active:scale-95"
        >
          <Icon name="refresh" />
          Refresh list
        </button>
      ) : null}
    </div>
  );
}
