import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth-session';
import { getTeam, startTeamChallenge, getTeamRemainingSeconds, isTeamTimeExpired } from '@/lib/db-store';

export async function POST() {
  try {
    const session = await getCurrentSession();
    if (!session || !session.teamId) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid participant session required.' },
        { status: 401 }
      );
    }

    const team = getTeam(session.teamId);
    if (!team) {
      return NextResponse.json(
        { error: 'Team record not found.' },
        { status: 404 }
      );
    }

    const result = startTeamChallenge(team.id, 20);
    const remainingSeconds = getTeamRemainingSeconds(team);

    return NextResponse.json({
      success: true,
      message: result.message,
      team: {
        id: team.id,
        name: team.name,
        currentChallengeIndex: team.currentChallengeIndex,
        isCompleted: team.isCompleted,
        completedAt: team.completedAt,
        reviewStatus: team.reviewStatus,
        mapEligible: team.mapEligible,
        finishRank: team.finishRank,
        score: team.score,
        totalAttempts: team.totalAttempts,
        startedAt: team.startedAt,
        timerEndTime: team.timerEndTime,
        durationMinutes: team.durationMinutes || 20,
        hasStarted: !!team.startedAt,
        remainingSeconds,
        isExpired: isTeamTimeExpired(team),
      },
      remainingSeconds,
    });
  } catch (error) {
    console.error('Error starting challenge:', error);
    return NextResponse.json(
      { error: 'Internal server error while starting the challenge.' },
      { status: 500 }
    );
  }
}

