import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth-session';
import { db, resetEventRun, startGlobalGame } from '@/lib/db-store';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();

    if (!session || session.role !== 'organizer') {
      return NextResponse.json({ error: 'Forbidden: Organizer clearance required.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, durationMinutes } = body;

    if (action === 'start') {
      const result = startGlobalGame();
      return NextResponse.json(result);
    } else if (action === 'pause') {
      db.eventConfig.status = 'paused';
      return NextResponse.json({ success: true, message: 'Event timer paused.' });
    } else if (action === 'resume') {
      db.eventConfig.status = 'active';
      return NextResponse.json({ success: true, message: 'Event timer resumed.' });
    } else if (action === 'reset') {
      const result = resetEventRun();
      return NextResponse.json(result);
    } else if (action === 'set_duration') {
      const mins = Number(durationMinutes) || 20;
      const now = new Date();
      db.eventConfig.durationMinutes = mins;
      db.eventConfig.startTime = now.toISOString();
      db.eventConfig.endTime = new Date(now.getTime() + mins * 60 * 1000).toISOString();
      db.eventConfig.status = 'active';
      return NextResponse.json({ 
        success: true, 
        message: `Event clock set to ${mins} minutes starting now.` 
      });
    } else {
      return NextResponse.json({ error: 'Unknown control action.' }, { status: 400 });
    }
  } catch (error) {
    console.error('Control error:', error);
    return NextResponse.json({ error: 'Server error processing control action.' }, { status: 500 });
  }
}
