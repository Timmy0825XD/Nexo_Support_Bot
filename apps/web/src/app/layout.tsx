import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MW Tournament Platform',
  description: 'Team registration for Modern Warships tournaments',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
