import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth-session';
import { unlockHint, getTeam } from '@/lib/db-store';

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
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
    }

    const body = await request.json();
    const { challengeId } = body;

    if (!challengeId) {
      return NextResponse.json({ error: 'challengeId is required.' }, { status: 400 });
    }

    const result = unlockHint(team.id, Number(challengeId));

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      hint: result.hint,
      message: result.message,
      score: team.score,
    });
  } catch (error) {
    console.error('Hint error:', error);
    return NextResponse.json({ error: 'Internal server error processing hint request.' }, { status: 500 });
  }
}
