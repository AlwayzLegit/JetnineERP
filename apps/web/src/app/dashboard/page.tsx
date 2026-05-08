// Server-component wrapper. Forces dynamic rendering so the
// child client component (which uses better-auth's useSession +
// useRouter) isn't tripped by Next.js's prerender pass — those
// hooks need a runtime React dispatcher that SSG doesn't supply.
export const dynamic = 'force-dynamic';

import DashboardClient from './dashboard-client';

export default function DashboardPage() {
  return <DashboardClient />;
}
