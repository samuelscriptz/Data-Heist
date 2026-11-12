import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth-session';
import { getTeam, getUnlockedHint, getTeamRemainingSeconds, isTeamTimeExpired } from '@/lib/db-store';
import { SERVER_CHALLENGES, getSanitizedChallenge } from '@/lib/challenges-data';

export async function GET() {
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

  // Generate node overview for visual progress map (all 10 nodes)
  const mapNodes = SERVER_CHALLENGES.map((ch) => {
    const isSolved = ch.id < team.currentChallengeIndex || team.isCompleted;
    const isCurrent = ch.id === team.currentChallengeIndex && !team.isCompleted;
    const isLocked = ch.id > team.currentChallengeIndex;

    return {
      id: ch.id,
      title: ch.title,
      category: ch.category,
      difficulty: ch.difficulty,
      points: ch.points,
      status: isSolved ? 'completed' : isCurrent ? 'current' : 'locked',
    };
  });

  // Get active challenge details
  let activeChallenge = null;
  if (!team.isCompleted && team.currentChallengeIndex <= 10) {
    const hint = getUnlockedHint(team.id, team.currentChallengeIndex);
    activeChallenge = getSanitizedChallenge(
      team.currentChallengeIndex,
      true,
      false,
      hint
    );
  }

  return NextResponse.json({
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
      remainingSeconds: getTeamRemainingSeconds(team),
      isExpired: isTeamTimeExpired(team),
    },
    mapNodes,
    activeChallenge,
  });
}
