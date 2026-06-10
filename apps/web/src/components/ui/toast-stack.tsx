'use client';

import { useEffect } from 'react';
import { Icon } from './icon';

export interface ToastItem {
  id: string;
  message: string;
}

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div className="toast-glass pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl px-4 py-3">
      <Icon name="error" className="mt-0.5 shrink-0 text-error" />
      <p className="text-label-sm flex-1 text-on-surface">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 text-on-surface-variant transition-colors hover:text-on-surface"
        aria-label="Dismiss"
      >
        <Icon name="close" className="text-lg" />
      </button>
    </div>
  );
}
