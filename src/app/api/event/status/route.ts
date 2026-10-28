import { NextResponse } from 'next/server';
import { db } from '@/lib/db-store';

export async function GET() {
  const config = db.eventConfig;
  const now = new Date();

  let remainingSeconds = 0;
  if (config.endTime && config.status === 'active') {
    const end = new Date(config.endTime).getTime();
    remainingSeconds = Math.max(0, Math.floor((end - now.getTime()) / 1000));
    
    // Automatically transition to ended if remaining time reaches 0
    if (remainingSeconds === 0 && config.status === 'active') {
      config.status = 'ended';
    }
  }

  return NextResponse.json({
    name: config.name,
    status: config.status,
    durationMinutes: config.durationMinutes,
    startTime: config.startTime,
    endTime: config.endTime,
    venueName: config.venueName,
    venueRoom: config.venueRoom,
    serverTimestamp: now.toISOString(),
    remainingSeconds,
    mapQuota: config.mapQuota,
  });
}
