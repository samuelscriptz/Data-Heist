import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth-session';
import { approveTeamCompletion, rejectTeamCompletion } from '@/lib/db-store';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();

    // Strict RBAC: Organizer only
    if (!session || session.role !== 'organizer') {
      return NextResponse.json(
        { error: 'Forbidden: Organizer credentials required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { teamId, action, reason } = body;

    if (!teamId || !action) {
      return NextResponse.json(
        { error: 'teamId and action (approve | reject) are required.' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      const result = await approveTeamCompletion(teamId, session.userId);
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        mapEligible: result.mapEligible,
        rank: result.rank,
        message: result.message,
      });
    } else if (action === 'reject') {
      const result = rejectTeamCompletion(teamId, session.userId, reason || 'Flagged by proctor');
      return NextResponse.json({
        success: true,
        message: result.message,
      });
    } else {
      return NextResponse.json({ error: 'Invalid action. Must be approve or reject.' }, { status: 400 });
    }
  } catch (error) {
    console.error('Approval action error:', error);
    return NextResponse.json({ error: 'Server error during approval process.' }, { status: 500 });
  }
}
