import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/db-store';
import { createSession } from '@/lib/auth-session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    const session = authenticateAdmin(username, password);

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid proctor credentials. Access denied.' },
        { status: 401 }
      );
    }

    await createSession(session);

    return NextResponse.json({
      success: true,
      user: {
        username: session.username,
        displayName: session.displayName,
        role: session.role,
        teamId: session.teamId,
      },
      redirectTo: '/organizer',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication service encountered an unexpected error.' },
      { status: 500 }
    );
  }
}
