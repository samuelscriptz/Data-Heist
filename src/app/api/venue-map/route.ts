import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth-session';
import { getVenueMapForTeam, getTeam } from '@/lib/db-store';

export async function GET() {
  const session = await getCurrentSession();

  // Must be authenticated
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required.' },
      { status: 401 }
    );
  }

  // Organizers can inspect the venue map directly for verification
  if (session.role === 'organizer') {
    const adminMap = getVenueMapForTeam('team-1') || {
      accessGranted: true,
      teamName: 'Lead Proctor [Organizer Preview]',
      finishRank: 0,
      venueName: 'Advanced Programming Lab',
      venueRoom: 'Lab 304 - Cyber Enclave',
      revealedAt: new Date().toISOString(),
      secretExtractionCode: 'DH-8842-OMEGA-MASTER',
      mapCoordinates: 'Lab 304 - Rack Bay D - Container 3B',
      mapSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650"><rect width="1000" height="650" fill="#080c14"/><text x="50" y="50" fill="#00ff9d" font-family="monospace">VENUE MAP PREVIEW [ORGANIZER CLEARANCE]</text></svg>`,
      instructions: ['Organizer master review view.'],
    };

    return NextResponse.json(adminMap, {
      headers: { 'Cache-Control': 'no-store, private' },
    });
  }

  // Participants: Strict authorization
  if (!session.teamId) {
    return NextResponse.json(
      { error: 'Unauthorized: No team identity linked to this session.' },
      { status: 401 }
    );
  }

  const team = getTeam(session.teamId);
  if (!team) {
    return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
  }

  // Verification check:
  // Must have completed all 10 challenges AND received proctor/admin approval
  if (!team.isCompleted || team.reviewStatus !== 'approved' || !team.mapEligible) {
    return NextResponse.json(
      { 
        error: 'Access Denied: Venue map access requires official organizer/admin approval. Your completion status is currently pending or not eligible.',
        reviewStatus: team.reviewStatus,
        mapEligible: team.mapEligible,
      },
      { status: 403 }
    );
  }

  // All 10 challenges completed and approved! Fetch the 3-floor venue map
  const mapData = getVenueMapForTeam(team.id);
  if (!mapData) {
    return NextResponse.json(
      { error: 'Unable to retrieve venue blueprint data. Organizer approval required.' },
      { status: 403 }
    );
  }

  // Return strictly private, un-cached response
  return NextResponse.json({
    ...mapData,
    reviewStatus: team.reviewStatus,
    mapEligible: team.mapEligible,
    finishRank: team.finishRank,
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
    },
  });
}
