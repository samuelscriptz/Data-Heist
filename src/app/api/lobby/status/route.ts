import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth-session';
import { getTeam, db, getTeamRemainingSeconds, isTeamTimeExpired } from '@/lib/db-store';

export async function GET() {
  try {
    const session = await getCurrentSession();

    if (!session || !session.teamId) {
      return NextResponse.json({
        authenticated: false,
        gameStarted: db.eventConfig.gameStarted,
      });
    }

    const team = getTeam(session.teamId);

    if (!team) {
      return NextResponse.json({
        authenticated: false,
        gameStarted: db.eventConfig.gameStarted,
      });
    }

    const remainingSeconds = getTeamRemainingSeconds(team);

    return NextResponse.json({
      authenticated: true,
      team: {
        id: team.id,
        name: team.name,
        lobbyStatus: team.lobbyStatus,
        currentChallengeIndex: team.currentChallengeIndex,
        score: team.score,
        totalAttempts: team.totalAttempts,
        isCompleted: team.isCompleted,
        reviewStatus: team.reviewStatus,
        mapEligible: team.mapEligible,
        reconnectPending: team.reconnectPending,
        startedAt: team.startedAt,
        timerEndTime: team.timerEndTime,
        durationMinutes: team.durationMinutes || 20,
      },
      gameStarted: db.eventConfig.gameStarted,
      gameStartedAt: db.eventConfig.gameStartedAt,
      gameEndTime: db.eventConfig.gameEndTime,
      remainingSeconds,
      isExpired: isTeamTimeExpired(team),
    });
  } catch (error) {
    console.error('Lobby status query error:', error);
    return NextResponse.json(
      { error: 'Failed to inspect lobby telemetry.' },
      { status: 500 }
    );
  }
}

