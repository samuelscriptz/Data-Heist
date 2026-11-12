import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth-session';
import { 
  getAllTeams, 
  admitTeam, 
  admitAllTeams, 
  kickTeam, 
  approveTeamReconnection, 
  startGlobalGame, 
  getActivityFeed, 
  db 
} from '@/lib/db-store';

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.role !== 'organizer') {
    return NextResponse.json(
      { error: 'Forbidden: Organizer credentials required.' },
      { status: 403 }
    );
  }

  const teams = getAllTeams();
  const pendingTeams = teams.filter(t => t.lobbyStatus === 'pending_admission');
  const admittedTeams = teams.filter(t => t.lobbyStatus === 'admitted');
  const inGameTeams = teams.filter(t => t.lobbyStatus === 'in_game');
  const reconnectRequests = teams.filter(t => t.reconnectPending);

  return NextResponse.json({
    success: true,
    teams,
    pendingTeams,
    admittedTeams,
    inGameTeams,
    reconnectRequests,
    gameStarted: db.eventConfig.gameStarted,
    eventConfig: db.eventConfig,
    activityFeed: getActivityFeed(60),
  });
}

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'organizer') {
    return NextResponse.json(
      { error: 'Forbidden: Organizer credentials required.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { action, teamId } = body;

    if (action === 'admit') {
      if (!teamId) return NextResponse.json({ error: 'teamId required' }, { status: 400 });
      const res = admitTeam(teamId);
      return NextResponse.json(res);
    }

    if (action === 'admit_all') {
      const res = admitAllTeams();
      return NextResponse.json(res);
    }

    if (action === 'kick') {
      if (!teamId) return NextResponse.json({ error: 'teamId required' }, { status: 400 });
      const res = kickTeam(teamId);
      return NextResponse.json(res);
    }

    if (action === 'approve_reconnect') {
      if (!teamId) return NextResponse.json({ error: 'teamId required' }, { status: 400 });
      const res = approveTeamReconnection(teamId);
      return NextResponse.json(res);
    }

    if (action === 'start_game') {
      const res = startGlobalGame();
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('Lobby control error:', error);
    return NextResponse.json(
      { error: 'Failed to execute lobby administrative action.' },
      { status: 500 }
    );
  }
}

