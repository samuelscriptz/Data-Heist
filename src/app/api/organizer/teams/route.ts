import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth-session';
import { getAllTeams, db } from '@/lib/db-store';

export async function GET() {
  const session = await getCurrentSession();

  // Strict RBAC: Organizer role only
  if (!session || session.role !== 'organizer') {
    return NextResponse.json(
      { error: 'Forbidden: Organizer clearance required.' },
      { status: 403 }
    );
  }

  const teams = getAllTeams();
  const pendingReview = teams.filter(t => t.isCompleted && t.reviewStatus === 'pending');
  const approvedTeams = teams
    .filter(t => t.reviewStatus === 'approved')
    .sort((a, b) => (a.finishRank || 99) - (b.finishRank || 99));

  const mapQuota = db.eventConfig.mapQuota || 6;
  const mapSlotsOccupied = approvedTeams.filter(t => t.mapEligible).length;

  return NextResponse.json({
    teams,
    pendingReview,
    approvedTeams,
    recentSubmissions: db.submissions.slice(0, 30),
    mapQuota,
    mapSlotsOccupied,
    mapSlotsRemaining: Math.max(0, mapQuota - mapSlotsOccupied),
    eventConfig: db.eventConfig,
  });
}
