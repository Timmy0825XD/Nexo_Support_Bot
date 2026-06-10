import { Suspense } from 'react';
import { AdminLoginForm } from '../../../components/admin-login-form';

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
          <p className="text-on-surface-variant">Loading...</p>
        </main>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
