import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/db-store';
import { createSession } from '@/lib/auth-session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Admin username and passphrase required.' },
        { status: 400 }
      );
    }

    const sessionData = authenticateAdmin(username, password);

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Invalid proctor credentials. Access denied.' },
        { status: 401 }
      );
    }

    await createSession(sessionData);

    return NextResponse.json({
      success: true,
      message: 'Proctor clearance authorized.',
      redirectTo: '/organizer',
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return NextResponse.json(
      { error: 'Internal error during proctor authentication.' },
      { status: 500 }
    );
  }
}

