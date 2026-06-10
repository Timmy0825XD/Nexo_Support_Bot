import { RegistrationForm } from '../../../components/registration-form';
import {
  RegistrationClosed,
  TournamentNotFound,
} from '../../../components/registration-status';
import { Atmosphere } from '../../../components/ui/atmosphere';
import { getTournamentPublic } from '../../../lib/api';

interface RegisterPageProps {
  params: Promise<{ tournamentId: string }>;
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { tournamentId } = await params;
  const tournament = await getTournamentPublic(tournamentId);

  if (!tournament) {
    return <TournamentNotFound />;
  }

  if (!tournament.registrationOpen) {
    return <RegistrationClosed tournamentName={tournament.name} />;
  }

  return (
    <>
      <Atmosphere />
      <main className="mx-auto min-h-screen max-w-[672px] px-4 pt-12 pb-24 md:pt-20">
        <header className="mb-stack-lg text-center md:text-left">
          <span className="text-label-sm mb-2 block font-medium tracking-widest text-primary uppercase">
            Tournament Registration
          </span>
          <h1 className="text-page-title-mobile md:text-page-title mb-2 text-on-surface">
            {tournament.name}
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Format: {tournament.format.toUpperCase()}
          </p>
        </header>

        <RegistrationForm
          tournamentId={tournament.id}
          tournamentName={tournament.name}
          format={tournament.format}
        />
      </main>
    </>
  );
}
