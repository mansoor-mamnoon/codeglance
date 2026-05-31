import { HydrateClient } from '~/trpc/server';
import { api } from '~/trpc/server';
import { auth } from '~/server/auth';
import { redirect } from 'next/navigation';
import { DashboardView } from '~/components/dashboard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect('/login');

  void api.post.getLatest.prefetch();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center bg-background">
        <DashboardView session={session} />
      </main>
    </HydrateClient>
  );
}
