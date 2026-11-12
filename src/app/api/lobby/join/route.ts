import { NextRequest, NextResponse } from 'next/server';
import { joinLobby } from '@/lib/db-store';
import { getOrCreateSessionToken, createSession } from '@/lib/auth-session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamName } = body;

    if (!teamName || typeof teamName !== 'string' || !teamName.trim()) {
      return NextResponse.json(
        { error: 'Please enter a valid team codename.' },
        { status: 400 }
      );
    }

    const sessionId = await getOrCreateSessionToken();
    const result = joinLobby(teamName, sessionId);

    if (result.alreadyActive && result.team) {
      return NextResponse.json({
        success: false,
        alreadyActive: true,
        team: {
          id: result.team.id,
          name: result.team.name,
          currentChallengeIndex: result.team.currentChallengeIndex,
          score: result.team.score,
          lobbyStatus: result.team.lobbyStatus,
        },
        message: result.message,
      }, { status: 409 });
    }

    if (!result.success || !result.team) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    // Create session for participant
    await createSession({
      userId: result.team.id,
      username: result.team.username,
      displayName: result.team.name,
      role: 'participant',
      teamId: result.team.id,
      teamName: result.team.name,
    }, sessionId);

    return NextResponse.json({
      success: true,
      team: {
        id: result.team.id,
        name: result.team.name,
        lobbyStatus: result.team.lobbyStatus,
        currentChallengeIndex: result.team.currentChallengeIndex,
        score: result.team.score,
      },
      status: result.status,
      gameStarted: result.gameStarted,
      message: result.message,
    });
  } catch (error) {
    console.error('Lobby join error:', error);
    return NextResponse.json(
      { error: 'Internal failure joining the lobby.' },
      { status: 500 }
    );
  }
}

