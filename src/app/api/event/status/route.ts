import { NextResponse } from 'next/server';
import { db } from '@/lib/db-store';

export async function GET() {
  const config = db.eventConfig;
  const now = new Date();
  const effectiveEnd = config.gameEndTime || config.endTime;

  let remainingSeconds = (config.durationMinutes || 20) * 60;

  if (config.status === 'paused') {
    remainingSeconds = config.pausedRemainingSeconds ?? remainingSeconds;
  } else if (effectiveEnd && config.status === 'active') {
    const end = new Date(effectiveEnd).getTime();
    remainingSeconds = Math.max(0, Math.floor((end - now.getTime()) / 1000));
    
    // Automatically transition to ended if remaining time reaches 0
    if (remainingSeconds === 0) {
      config.status = 'ended';
    }
  }

  return NextResponse.json({
    name: config.name,
    status: config.status,
    gameStarted: config.gameStarted,
    durationMinutes: config.durationMinutes,
    startTime: config.startTime || config.gameStartedAt,
    endTime: effectiveEnd,
    venueName: config.venueName,
    venueRoom: config.venueRoom,
    serverTimestamp: now.toISOString(),
    remainingSeconds,
    mapQuota: config.mapQuota,
  }, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
  });
}
