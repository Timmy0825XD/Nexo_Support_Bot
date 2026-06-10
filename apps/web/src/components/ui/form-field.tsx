import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  className?: string;
  children: ReactNode;
}

export function FormField({ label, className, children }: FormFieldProps) {
  return (
    <div className={`space-y-1 ${className ?? ''}`}>
      <label className="text-label-sm text-on-surface-variant block">{label}</label>
      {children}
    </div>
  );
}

export function inputClassName(hasError?: boolean) {
  return `form-input appearance-none ${hasError ? 'form-input-error' : ''}`;
}
