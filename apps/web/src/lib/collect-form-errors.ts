import type { FieldErrors } from 'react-hook-form';
import type { SubmitRegistrationInput } from '@mw-platform/shared';

function pushMessage(messages: string[], message: unknown) {
  if (typeof message === 'string' && message.length > 0 && !messages.includes(message)) {
    messages.push(message);
  }
}

export function collectRegistrationErrors(
  errors: FieldErrors<SubmitRegistrationInput>,
): string[] {
  const messages: string[] = [];

  pushMessage(messages, errors.teamName?.message);

  if (errors.participants && !Array.isArray(errors.participants)) {
    pushMessage(messages, errors.participants.message);
  }

  if (Array.isArray(errors.participants)) {
    for (const participant of errors.participants) {
      if (!participant || typeof participant !== 'object') continue;

      for (const field of Object.values(participant)) {
        if (field && typeof field === 'object' && 'message' in field) {
          pushMessage(messages, field.message);
        }
      }
    }
  }

  return messages;
}
