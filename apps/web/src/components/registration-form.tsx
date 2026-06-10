'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  CURRENT_TITLES,
  createSubmitRegistrationSchema,
  getParticipantCount,
  getParticipantRoleLabel,
  requiresManualTeamName,
  type SubmitRegistrationInput,
  type TournamentFormat,
} from '@mw-platform/shared';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { submitRegistration } from '../lib/api';
import { collectRegistrationErrors } from '../lib/collect-form-errors';
import { RegistrationSuccess } from './registration-success';
import { FormField, inputClassName } from './ui/form-field';
import { Icon } from './ui/icon';
import { ToastStack, type ToastItem } from './ui/toast-stack';

interface RegistrationFormProps {
  tournamentId: string;
  tournamentName: string;
  format: TournamentFormat;
}

function emptyParticipant(): SubmitRegistrationInput['participants'][number] {
  return {
    discordTag: '',
    discordId: '',
    inGameName: '',
    inGameId: '',
    currentTitle: 'Untitled',
  };
}

export function RegistrationForm({ tournamentId, tournamentName, format }: RegistrationFormProps) {
  const participantCount = getParticipantCount(format);
  const showTeamName = requiresManualTeamName(format);
  const schema = createSubmitRegistrationSchema(format);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SubmitRegistrationInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      teamName: '',
      participants: Array.from({ length: participantCount }, emptyParticipant),
    },
  });

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToasts = useCallback((messages: string[]) => {
    if (messages.length > 0) {
      setToasts(
        messages.map((message, index) => ({
          id: `${Date.now()}-${index}`,
          message,
        })),
      );
    }
  }, []);

  const onSubmit = handleSubmit(
    async (data) => {
      setToasts([]);

      try {
        await submitRegistration(tournamentId, data);
        setSubmitted(true);
      } catch (error) {
        showToasts([
          error instanceof Error ? error.message : 'Submission failed. Please try again.',
        ]);
      }
    },
    (fieldErrors) => {
      showToasts(collectRegistrationErrors(fieldErrors));
    },
  );

  if (submitted) {
    return <RegistrationSuccess tournamentName={tournamentName} />;
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-stack-lg">
        {showTeamName ? (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Icon name="shield" className="text-primary" />
              <h2 className="text-section-title text-on-surface">Team Identity</h2>
            </div>
            <div className="glass-card space-y-4 rounded-xl border-t-2 border-t-indigo-500/40 p-6">
              <FormField label="Team Name">
                <input
                  {...register('teamName')}
                  className={inputClassName(!!errors.teamName)}
                  autoComplete="off"
                />
              </FormField>
            </div>
          </section>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border border-slate-700 border-t-2 border-t-indigo-500/40 bg-slate-800 p-4">
            <Icon name="info" className="mt-0.5 text-primary" />
            <p className="text-label-sm text-slate-400">
              Your team name will be set automatically from your Discord tag.
            </p>
          </div>
        )}

        <section className="space-y-stack-md">
          <div className="mb-4 flex items-center gap-2">
            <Icon name="groups" className="text-primary" />
            <h2 className="text-section-title text-on-surface">Roster Members</h2>
          </div>

          <div className="space-y-4">
            {Array.from({ length: participantCount }).map((_, slotIndex) => {
              const isCaptain = slotIndex === 0;
              const roleLabel = getParticipantRoleLabel(slotIndex);
              const participantErrors = errors.participants?.[slotIndex];

              return (
                <div
                  key={slotIndex}
                  className={`glass-card relative overflow-hidden rounded-xl border-t-2 border-t-indigo-500/40 p-6 ${
                    isCaptain ? 'border-l-4 border-l-primary' : ''
                  }`}
                >
                  {isCaptain ? (
                    <div className="absolute top-0 right-0 bg-primary px-3 py-1 text-[10px] font-bold tracking-tighter text-on-primary uppercase">
                      Captain
                    </div>
                  ) : null}

                  <h3
                    className={`text-label-sm mb-4 flex items-center gap-2 font-bold uppercase ${
                      isCaptain ? 'text-primary' : 'text-on-surface tracking-wide'
                    }`}
                  >
                    {isCaptain ? <Icon name="star" className="text-sm" filled /> : null}
                    {roleLabel} Details
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField label="Discord Tag">
                      <input
                        {...register(`participants.${slotIndex}.discordTag`)}
                        className={inputClassName(!!participantErrors?.discordTag)}
                        autoComplete="off"
                      />
                    </FormField>

                    <FormField label="Discord ID">
                      <input
                        {...register(`participants.${slotIndex}.discordId`)}
                        className={inputClassName(!!participantErrors?.discordId)}
                        autoComplete="off"
                      />
                    </FormField>

                    <FormField label="In-game Name">
                      <input
                        {...register(`participants.${slotIndex}.inGameName`)}
                        className={inputClassName(!!participantErrors?.inGameName)}
                      />
                    </FormField>

                    <FormField label="In-game ID">
                      <input
                        {...register(`participants.${slotIndex}.inGameId`)}
                        className={inputClassName(!!participantErrors?.inGameId)}
                        autoComplete="off"
                      />
                    </FormField>

                    <FormField label="Current Title" className="col-span-1 md:col-span-2">
                      <select
                        {...register(`participants.${slotIndex}.currentTitle`)}
                        className={inputClassName(!!participantErrors?.currentTitle)}
                      >
                        {CURRENT_TITLES.map((title) => (
                          <option key={title} value={title}>
                            {title}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary-container px-8 py-4 font-bold text-on-primary-container shadow-lg shadow-primary-container/20 transition-all hover:bg-secondary-container active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Icon name="refresh" className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit registration
                <Icon name="send" />
              </>
            )}
          </button>

          <p className="text-hint-xs mt-4 text-center text-on-surface-variant">
            By submitting, you agree to the tournament fair play policy and ruleset.
          </p>
        </div>
      </form>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
