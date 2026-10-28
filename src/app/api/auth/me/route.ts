import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth-session';
import { getTeam } from '@/lib/db-store';

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  let teamData = null;
  if (session.teamId) {
    teamData = getTeam(session.teamId);
  }

  return NextResponse.json({
    authenticated: true,
    user: session,
    team: teamData,
  });
}
