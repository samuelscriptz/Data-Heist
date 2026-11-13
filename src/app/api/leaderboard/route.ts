import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/db-store';

export async function GET() {
  const leaderboard = getLeaderboard();

  return NextResponse.json(
    { leaderboard, timestamp: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}
