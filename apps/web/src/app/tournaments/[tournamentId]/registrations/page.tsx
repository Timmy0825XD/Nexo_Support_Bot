import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { RegistrationSpreadsheet } from '../../../../components/registration-spreadsheet';
import { TournamentNotFound } from '../../../../components/registration-status';
import { ManagerAtmosphere } from '../../../../components/ui/manager-atmosphere';
import { getTournament, listRegistrations } from '../../../../lib/api-server';
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from '../../../../lib/admin-auth';

interface TournamentRegistrationsPageProps {
  params: Promise<{ tournamentId: string }>;
}

export default async function TournamentRegistrationsPage({
  params,
}: TournamentRegistrationsPageProps) {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  const { tournamentId } = await params;
  const redirectPath = `/tournaments/${tournamentId}/registrations`;

  if (!isValidAdminSession(session)) {
    redirect(`/admin/login?from=${encodeURIComponent(redirectPath)}`);
  }

  const tournament = await getTournament(tournamentId);

  if (!tournament) {
    return <TournamentNotFound />;
  }

  const { registrations } = await listRegistrations(tournamentId);

  return (
    <>
      <ManagerAtmosphere />
      <main className="relative mx-auto min-h-screen w-full max-w-[1400px] px-4 py-8 pb-24 md:px-8">
        <RegistrationSpreadsheet
          tournamentId={tournament.id}
          tournamentName={tournament.name}
          format={tournament.format}
          initialRegistrations={registrations}
        />
      </main>
    </>
  );
}
