import { NextRequest, NextResponse } from 'next/server';
import { requestTeamReconnection } from '@/lib/db-store';
import { getOrCreateSessionToken } from '@/lib/auth-session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId is required for reconnection request.' },
        { status: 400 }
      );
    }

    const sessionId = await getOrCreateSessionToken();
    const result = requestTeamReconnection(teamId, sessionId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Reconnect request error:', error);
    return NextResponse.json(
      { error: 'Failed to submit reconnection request.' },
      { status: 500 }
    );
  }
}

