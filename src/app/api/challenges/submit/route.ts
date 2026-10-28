import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth-session';
import { getTeam, submitAnswer, checkRateLimit, db } from '@/lib/db-store';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.teamId) {
      return NextResponse.json(
        { error: 'Unauthorized: Participant session required.' },
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

    // Check event status
    if (db.eventConfig.status === 'paused') {
      return NextResponse.json(
        { error: 'Event is currently paused by organizers. Submissions are temporarily held.' },
        { status: 403 }
      );
    }

    if (db.eventConfig.status === 'ended') {
      return NextResponse.json(
        { error: 'The 90-minute DATA HEIST symposium has concluded. Submissions closed.' },
        { status: 403 }
      );
    }

    // Rate limiting check
    const rateCheck = checkRateLimit(team.id);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { 
          error: `Rate limit triggered. Cooldown active. Please wait ${rateCheck.waitSeconds} seconds before submitting again.` 
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { challengeId, answer } = body;

    if (!challengeId || typeof answer !== 'string') {
      return NextResponse.json(
        { error: 'challengeId (number) and answer (string) are required.' },
        { status: 400 }
      );
    }

    if (answer.trim().length === 0) {
      return NextResponse.json(
        { error: 'Cannot submit an empty payload.' },
        { status: 400 }
      );
    }

    // Authoritative server-side answer evaluation
    const result = submitAnswer(team.id, Number(challengeId), answer);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      correct: result.correct,
      message: result.message,
      newChallengeIndex: result.newChallengeIndex,
      isFinished: result.isFinished,
      team: {
        score: team.score,
        currentChallengeIndex: team.currentChallengeIndex,
        isCompleted: team.isCompleted,
        completedAt: team.completedAt,
        reviewStatus: team.reviewStatus,
      },
    });
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { error: 'An error occurred while evaluating your payload.' },
      { status: 500 }
    );
  }
}
