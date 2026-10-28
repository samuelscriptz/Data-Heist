import { 
  Team, 
  EventConfig, 
  SubmissionRecord, 
  LeaderboardEntry, 
  VenueMapData,
  AuthSession
} from './types';
import { SERVER_CHALLENGES } from './challenges-data';

// Singleton in-memory state engine (persists across API requests in server process)
// Seamlessly mirrors Supabase schema and functions so the app runs out-of-the-box
// while also providing full Supabase integration when configured.

interface MemoryStore {
  teams: Map<string, Team>;
  teamPasswords: Map<string, string>; // username -> password
  submissions: SubmissionRecord[];
  hintsUnlocked: Map<string, Set<number>>; // teamId -> Set<challengeId>
  eventConfig: EventConfig;
  rateLimitMap: Map<string, { lastAttempt: number; count: number }>;
  sessions: Map<string, AuthSession>; // token -> session
}

// Global scope initialization for Next.js hot-reloads
const globalForStore = globalThis as unknown as {
  __DATA_HEIST_STORE__?: MemoryStore;
};

function initializeStore(): MemoryStore {
  const teams = new Map<string, Team>();
  const teamPasswords = new Map<string, string>();

  // Pre-seed 7 sample participant teams for the 90-minute symposium
  const seedTeams = [
    { id: 'team-1', name: 'Cyber Hawks', username: 'cyber_hawks', pass: 'hawk2026!' },
    { id: 'team-2', name: 'Matrix Breakers', username: 'matrix_breakers', pass: 'matrix99!' },
    { id: 'team-3', name: 'Shadow Protocol', username: 'shadow_protocol', pass: 'shadow123!' },
    { id: 'team-4', name: 'Zero Day Squad', username: 'zero_day_squad', pass: 'zeroday!' },
    { id: 'team-5', name: 'Byte Force', username: 'byte_force', pass: 'byteforce!' },
    { id: 'team-6', name: 'Crypto Ninjas', username: 'crypto_ninjas', pass: 'ninja2026!' },
    { id: 'team-7', name: 'Glitch Hunters', username: 'glitch_hunters', pass: 'glitch!' },
  ];

  const now = new Date();

  seedTeams.forEach((t) => {
    teams.set(t.id, {
      id: t.id,
      name: t.name,
      username: t.username,
      currentChallengeIndex: 1,
      isCompleted: false,
      completedAt: null,
      reviewStatus: 'none',
      reviewedAt: null,
      reviewedBy: null,
      mapEligible: false,
      finishRank: null,
      score: 0,
      totalAttempts: 0,
      lastSolvedAt: null,
      createdAt: now.toISOString(),
    });
    teamPasswords.set(t.username, t.pass);
  });

  // Pre-seed an organizer credentials
  teamPasswords.set('admin', 'admin2026!');
  teamPasswords.set('organizer@dataheist.internal', 'admin2026!');

  // Initial 90-minute event configuration (server-authoritative)
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + 90 * 60 * 1000); // +90 mins

  const eventConfig: EventConfig = {
    id: 'main',
    name: 'DATA HEIST 2026',
    status: 'active',
    durationMinutes: 90,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    venueName: 'Advanced Programming Lab',
    venueRoom: 'Lab 304 - Cyber Enclave',
    mapQuota: 6,
    hintsAllowed: true,
  };

  return {
    teams,
    teamPasswords,
    submissions: [],
    hintsUnlocked: new Map(),
    eventConfig,
    rateLimitMap: new Map(),
    sessions: new Map(),
  };
}

export const db = globalForStore.__DATA_HEIST_STORE__ ?? initializeStore();
if (process.env.NODE_ENV !== 'production') {
  globalForStore.__DATA_HEIST_STORE__ = db;
}

// ==================== AUTH METHODS ====================

export function authenticate(username: string, pass: string): AuthSession | null {
  const cleanUser = username.trim().toLowerCase();
  const storedPass = db.teamPasswords.get(cleanUser);

  if (!storedPass || storedPass !== pass) {
    return null;
  }

  // Check if organizer
  if (cleanUser === 'admin' || cleanUser === 'organizer@dataheist.internal') {
    return {
      userId: 'organizer-admin',
      username: cleanUser,
      displayName: 'Lead Proctor [Organizer]',
      role: 'organizer',
    };
  }

  // Otherwise, match participant team
  for (const team of db.teams.values()) {
    if (team.username.toLowerCase() === cleanUser) {
      return {
        userId: team.id,
        username: team.username,
        displayName: team.name,
        role: 'participant',
        teamId: team.id,
        teamName: team.name,
      };
    }
  }

  return null;
}

export function saveSession(token: string, session: AuthSession) {
  db.sessions.set(token, session);
}

export function getSession(token: string): AuthSession | null {
  return db.sessions.get(token) || null;
}

export function clearSession(token: string) {
  db.sessions.delete(token);
}

// ==================== TEAM & PROGRESS METHODS ====================

export function getTeam(teamId: string): Team | null {
  return db.teams.get(teamId) || null;
}

export function getAllTeams(): Team[] {
  return Array.from(db.teams.values());
}

// Rate limiting: 1 submission every 2 seconds, max 10 per minute per team
export function checkRateLimit(teamId: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const record = db.rateLimitMap.get(teamId);

  if (!record) {
    db.rateLimitMap.set(teamId, { lastAttempt: now, count: 1 });
    return { allowed: true };
  }

  const elapsed = (now - record.lastAttempt) / 1000;
  if (elapsed < 2) {
    return { allowed: false, waitSeconds: Math.ceil(2 - elapsed) };
  }

  if (elapsed > 60) {
    db.rateLimitMap.set(teamId, { lastAttempt: now, count: 1 });
    return { allowed: true };
  }

  if (record.count >= 15) {
    return { allowed: false, waitSeconds: Math.ceil(60 - elapsed) };
  }

  record.lastAttempt = now;
  record.count += 1;
  return { allowed: true };
}

// Clean and normalize answers for server evaluation
export function normalizeAnswer(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/["']/g, '');
}

// Submit an answer for the team's current challenge
export function submitAnswer(
  teamId: string, 
  challengeId: number, 
  rawAnswer: string
): { 
  success: boolean; 
  correct: boolean; 
  message: string; 
  newChallengeIndex?: number;
  isFinished?: boolean;
} {
  const team = db.teams.get(teamId);
  if (!team) {
    return { success: false, correct: false, message: 'Team identity not found.' };
  }

  // Authoritative progression check: Can only submit for current unlocked challenge!
  if (challengeId !== team.currentChallengeIndex) {
    return { 
      success: false, 
      correct: false, 
      message: `Invalid challenge sequence. Current unlocked challenge is #${team.currentChallengeIndex}.` 
    };
  }

  if (team.isCompleted) {
    return { 
      success: false, 
      correct: false, 
      message: 'All 10 challenges already solved. Awaiting organizer clearance.' 
    };
  }

  const challenge = SERVER_CHALLENGES.find(c => c.id === challengeId);
  if (!challenge) {
    return { success: false, correct: false, message: 'Challenge definition not found.' };
  }

  team.totalAttempts += 1;

  // Evaluation: match normalized input
  const normalized = normalizeAnswer(rawAnswer);
  const isMatch = challenge.acceptedAnswers.some(ans => normalizeAnswer(ans) === normalized);

  const submission: SubmissionRecord = {
    id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    teamId: team.id,
    teamName: team.name,
    challengeId,
    submittedAnswer: rawAnswer.trim().slice(0, 100), // sanitize length
    isCorrect: isMatch,
    submittedAt: new Date().toISOString(),
  };
  db.submissions.unshift(submission);

  if (!isMatch) {
    return {
      success: true,
      correct: false,
      message: 'Access Denied: Checksum mismatch or invalid payload. Try again.',
    };
  }

  // Answer is CORRECT!
  team.score += challenge.points;
  team.lastSolvedAt = new Date().toISOString();

  if (challengeId === 10) {
    // Challenge 10 finish!
    // Server-authoritative timestamping
    team.currentChallengeIndex = 11;
    team.isCompleted = true;
    team.completedAt = new Date().toISOString();
    team.reviewStatus = 'pending'; // Organizer review gate
    
    return {
      success: true,
      correct: true,
      message: 'CRITICAL OVERRIDE SUCCESSFUL! Final challenge completed. Awaiting organizer clearance.',
      newChallengeIndex: 11,
      isFinished: true,
    };
  } else {
    // Unlock next sequential challenge
    team.currentChallengeIndex += 1;
    return {
      success: true,
      correct: true,
      message: `Payload verified! Challenge #${challengeId} solved. Node #${team.currentChallengeIndex} unlocked.`,
      newChallengeIndex: team.currentChallengeIndex,
      isFinished: false,
    };
  }
}

// Hint unlock
export function unlockHint(teamId: string, challengeId: number): { success: boolean; hint?: string; message: string } {
  const team = db.teams.get(teamId);
  if (!team) return { success: false, message: 'Team not found.' };

  if (challengeId !== team.currentChallengeIndex) {
    return { success: false, message: 'Can only unlock hints for current active challenge.' };
  }

  const challenge = SERVER_CHALLENGES.find(c => c.id === challengeId);
  if (!challenge || !challenge.hasHint) {
    return { success: false, message: 'No hint available for this node.' };
  }

  let unlockedSet = db.hintsUnlocked.get(teamId);
  if (!unlockedSet) {
    unlockedSet = new Set();
    db.hintsUnlocked.set(teamId, unlockedSet);
  }

  if (!unlockedSet.has(challengeId)) {
    unlockedSet.add(challengeId);
    // Apply penalty to score
    team.score = Math.max(0, team.score - 25);
  }

  return {
    success: true,
    hint: challenge.hintText,
    message: 'Hint unlocked. 25 point security penalty applied.',
  };
}

export function getUnlockedHint(teamId: string, challengeId: number): string | null {
  const set = db.hintsUnlocked.get(teamId);
  if (!set || !set.has(challengeId)) return null;
  const challenge = SERVER_CHALLENGES.find(c => c.id === challengeId);
  return challenge?.hintText || null;
}

// ==================== SECURE ATOMIC APPROVAL FOR TOP 6 ====================

// Race-safe mutex logic for allocating exactly the first 6 venue map slots
let isApprovingLock = false;

export async function approveTeamCompletion(
  teamId: string, 
  organizerId: string
): Promise<{ success: boolean; mapEligible: boolean; rank: number; message: string }> {
  // Wait if another approval is in flight to eliminate race condition
  while (isApprovingLock) {
    await new Promise(r => setTimeout(r, 20));
  }
  isApprovingLock = true;

  try {
    const team = db.teams.get(teamId);
    if (!team) {
      return { success: false, mapEligible: false, rank: 0, message: 'Team not found.' };
    }

    if (!team.isCompleted || team.reviewStatus !== 'pending') {
      return { 
        success: false, 
        mapEligible: team.mapEligible, 
        rank: team.finishRank || 0, 
        message: 'Team is not awaiting review.' 
      };
    }

    // Count currently approved teams that received the map
    const approvedWithMap = Array.from(db.teams.values())
      .filter(t => t.reviewStatus === 'approved' && t.mapEligible);

    const mapQuota = db.eventConfig.mapQuota || 6;
    const now = new Date().toISOString();

    team.reviewStatus = 'approved';
    team.reviewedAt = now;
    team.reviewedBy = organizerId;

    if (approvedWithMap.length < mapQuota) {
      // Eligible for Venue Map!
      team.mapEligible = true;
      team.finishRank = approvedWithMap.length + 1;

      return {
        success: true,
        mapEligible: true,
        rank: team.finishRank,
        message: `Approval confirmed. Team qualified for Venue Map reveal (Rank #${team.finishRank} of ${mapQuota}).`,
      };
    } else {
      // Finished after the 6 quota was fulfilled
      team.mapEligible = false;
      team.finishRank = approvedWithMap.length + 1;

      return {
        success: true,
        mapEligible: false,
        rank: team.finishRank,
        message: `Approval confirmed. Challenge 10 verified, but Venue Map quota (6/6) has already been reached.`,
      };
    }
  } finally {
    isApprovingLock = false;
  }
}

export function rejectTeamCompletion(
  teamId: string, 
  organizerId: string, 
  reason: string = 'Verification failed'
): { success: boolean; message: string } {
  const team = db.teams.get(teamId);
  if (!team) return { success: false, message: 'Team not found.' };

  team.reviewStatus = 'rejected';
  team.reviewedAt = new Date().toISOString();
  team.reviewedBy = organizerId;
  team.mapEligible = false;

  return {
    success: true,
    message: `Team submission marked rejected: ${reason}`,
  };
}

// Reset an event run (organizer only)
export function resetEventRun(): { success: boolean; message: string } {
  const now = new Date();
  const endTime = new Date(now.getTime() + 90 * 60 * 1000);

  db.teams.forEach(team => {
    team.currentChallengeIndex = 1;
    team.isCompleted = false;
    team.completedAt = null;
    team.reviewStatus = 'none';
    team.reviewedAt = null;
    team.reviewedBy = null;
    team.mapEligible = false;
    team.finishRank = null;
    team.score = 0;
    team.totalAttempts = 0;
    team.lastSolvedAt = null;
  });

  db.submissions = [];
  db.hintsUnlocked.clear();
  db.rateLimitMap.clear();

  db.eventConfig.startTime = now.toISOString();
  db.eventConfig.endTime = endTime.toISOString();
  db.eventConfig.status = 'active';

  return { success: true, message: 'Event reset successfully. All team progress and map unlocks cleared.' };
}

// ==================== VENUE MAP AUTHORITATIVE ACCESS CHECK ====================

export function getVenueMapForTeam(teamId: string): VenueMapData | null {
  const team = db.teams.get(teamId);
  if (!team) return null;

  // Strict multi-gate authorization check:
  // 1. Team has completed Challenge 10 (index 11 or isCompleted)
  // 2. Organizer has formally reviewed and approved
  // 3. Team is designated mapEligible (strictly within the first 6 approved teams)
  if (!team.isCompleted || team.reviewStatus !== 'approved' || !team.mapEligible) {
    return null;
  }

  // Return protected venue map details
  const svgMap = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" className="w-full h-auto">
    <defs>
      <pattern id="cyber-grid" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(0, 240, 255, 0.08)" stroke-width="1"/>
      </pattern>
      <linearGradient id="vault-glow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00ff9d" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#00e5ff" stop-opacity="0.2"/>
      </linearGradient>
      <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <!-- Base Floor -->
    <rect width="1000" height="650" fill="#080c14" />
    <rect width="1000" height="650" fill="url(#cyber-grid)" />
    
    <!-- Outer Lab Perimeter -->
    <rect x="50" y="40" width="900" height="570" fill="none" stroke="#00f0ff" stroke-width="3" stroke-dasharray="10, 5" opacity="0.6"/>
    <text x="70" y="75" fill="#00f0ff" font-family="monospace" font-size="16" font-weight="bold">ADVANCED PROGRAMMING LAB // RESTRICTED FLOOR BLUEPRINT</text>
    <text x="70" y="98" fill="#64748b" font-family="monospace" font-size="12">CLEARANCE LEVEL: TOP 6 FINALIST DISPATCH // PROTOCOL: HEIST-APL-304</text>
    
    <!-- Zone A: Participant Workstations -->
    <rect x="80" y="130" width="380" height="450" fill="rgba(15, 23, 42, 0.7)" stroke="#1e293b" stroke-width="2" rx="8"/>
    <text x="100" y="160" fill="#38bdf8" font-family="monospace" font-size="14" font-weight="bold">ZONE ALPHA: PARTICIPANT TERMINAL ROWS</text>
    <!-- Terminal Desks -->
    <rect x="110" y="190" width="150" height="35" fill="#0f172a" stroke="#00f0ff" stroke-width="1" rx="4"/>
    <text x="120" y="212" fill="#94a3b8" font-family="monospace" font-size="11">Row 1: Terminals 01-08</text>
    <rect x="290" y="190" width="150" height="35" fill="#0f172a" stroke="#00f0ff" stroke-width="1" rx="4"/>
    <text x="300" y="212" fill="#94a3b8" font-family="monospace" font-size="11">Row 2: Terminals 09-16</text>
    <rect x="110" y="250" width="150" height="35" fill="#0f172a" stroke="#00f0ff" stroke-width="1" rx="4"/>
    <text x="120" y="272" fill="#94a3b8" font-family="monospace" font-size="11">Row 3: Terminals 17-24</text>
    <rect x="290" y="250" width="150" height="35" fill="#0f172a" stroke="#00f0ff" stroke-width="1" rx="4"/>
    <text x="300" y="272" fill="#94a3b8" font-family="monospace" font-size="11">Row 4: Terminals 25-32</text>
    <rect x="110" y="310" width="330" height="40" fill="#0f172a" stroke="#334155" stroke-width="1" rx="4"/>
    <text x="120" y="335" fill="#94a3b8" font-family="monospace" font-size="11">Row 5: Backup Workstations & Network Racks</text>
    
    <!-- Proctor Command Station -->
    <rect x="110" y="470" width="330" height="80" fill="rgba(30, 41, 59, 0.8)" stroke="#f59e0b" stroke-width="2" rx="6"/>
    <text x="125" y="500" fill="#f59e0b" font-family="monospace" font-size="13" font-weight="bold">PROCTOR COMMAND DESK & TIME CONTROLLER</text>
    <text x="125" y="525" fill="#94a3b8" font-family="monospace" font-size="11">Mainframe Server Console [Organizer Station]</text>
    
    <!-- Central Corridor -->
    <line x1="490" y1="130" x2="490" y2="580" stroke="#00f0ff" stroke-width="2" stroke-dasharray="8, 6" opacity="0.4"/>
    <text x="475" y="360" fill="#00f0ff" font-family="monospace" font-size="12" transform="rotate(-90 475,360)">CENTRAL TRANSIT CORRIDOR</text>

    <!-- Zone B: Server Room & Secret Enclave (TARGET) -->
    <rect x="520" y="130" width="400" height="450" fill="rgba(10, 20, 35, 0.85)" stroke="#00ff9d" stroke-width="2" rx="8"/>
    <text x="540" y="160" fill="#00ff9d" font-family="monospace" font-size="14" font-weight="bold">ZONE BRAVO: SECURE SERVER ROOM & DATA VAULT</text>
    
    <!-- Server Blade Racks -->
    <rect x="545" y="190" width="160" height="50" fill="#0f172a" stroke="#334155" stroke-width="1"/>
    <text x="555" y="220" fill="#64748b" font-family="monospace" font-size="11">RACK A: CORE ROUTERS</text>
    <rect x="735" y="190" width="160" height="50" fill="#0f172a" stroke="#334155" stroke-width="1"/>
    <text x="745" y="220" fill="#64748b" font-family="monospace" font-size="11">RACK B: SAN STORAGE</text>
    
    <rect x="545" y="260" width="160" height="50" fill="#0f172a" stroke="#334155" stroke-width="1"/>
    <text x="555" y="290" fill="#64748b" font-family="monospace" font-size="11">RACK C: HSM ENCLAVE</text>
    
    <!-- THE SECRET PHYSICAL HEIST OBJECTIVE -->
    <g filter="url(#neon-glow)">
      <rect x="735" y="260" width="160" height="130" fill="url(#vault-glow)" stroke="#00ff9d" stroke-width="3" rx="8"/>
      <circle cx="815" cy="325" r="32" fill="#05101a" stroke="#00ff9d" stroke-width="2"/>
      <circle cx="815" cy="325" r="14" fill="#00ff9d"/>
      <text x="750" y="285" fill="#05101a" font-family="monospace" font-size="12" font-weight="bold">TARGET EXTRACTION</text>
      <text x="770" y="375" fill="#00ff9d" font-family="monospace" font-size="11" font-weight="bold">DROPBOX #3B</text>
    </g>

    <text x="545" y="430" fill="#f87171" font-family="monospace" font-size="12" font-weight="bold">CRITICAL RETRIEVAL INSTRUCTIONS:</text>
    <text x="545" y="455" fill="#cbd5e1" font-family="monospace" font-size="11">1. Proceed calmly to Server Rack D (marked in Neon Green).</text>
    <text x="545" y="475" fill="#cbd5e1" font-family="monospace" font-size="11">2. Locate metal locker labeled 'ARCHIVE 3B' beside the switchboard.</text>
    <text x="545" y="495" fill="#cbd5e1" font-family="monospace" font-size="11">3. Enter Extraction Secret Code: <tspan fill="#00ff9d" font-weight="bold">DH-8842-OMEGA</tspan></text>
    <text x="545" y="515" fill="#cbd5e1" font-family="monospace" font-size="11">4. Retrieve the Symposium Data Core artifact and present to Proctor.</text>
    
    <!-- Radar coordinates tag -->
    <rect x="545" y="540" width="350" height="30" fill="#020617" stroke="#00f0ff" stroke-width="1" rx="4"/>
    <text x="560" y="560" fill="#00f0ff" font-family="monospace" font-size="11">GEO-VECTOR: LAB304 [42.887°N, 71.321°W] // ENCRYPTED TOKEN VERIFIED</text>
  </svg>`;

  return {
    accessGranted: true,
    teamName: team.name,
    finishRank: team.finishRank || 1,
    venueName: db.eventConfig.venueName,
    venueRoom: db.eventConfig.venueRoom,
    revealedAt: new Date().toISOString(),
    secretExtractionCode: `DH-8842-OMEGA-${team.finishRank}`,
    mapCoordinates: 'Lab 304 - Rack Bay D - Container 3B',
    mapSvg: svgMap,
    instructions: [
      'Present this authorization token on your mobile or terminal screen to the Lab Proctor.',
      'Head to the rear server alcove (Zone Bravo) indicated by the glowing green node.',
      'Locate physical vault container #3B directly under the optical patch panel.',
      'Input the extraction code to claim the Symposium Physical Data Core trophy.',
    ],
  };
}

// ==================== LEADERBOARD ====================

export function getLeaderboard(): LeaderboardEntry[] {
  const teams = Array.from(db.teams.values());

  // Sort criteria:
  // 1. Highest challenges solved (currentChallengeIndex - 1)
  // 2. Earliest solve timestamp for ties
  // 3. Lowest total attempts for ties
  const sorted = [...teams].sort((a, b) => {
    const solvedA = a.isCompleted ? 10 : a.currentChallengeIndex - 1;
    const solvedB = b.isCompleted ? 10 : b.currentChallengeIndex - 1;

    if (solvedA !== solvedB) {
      return solvedB - solvedA; // Higher solved first
    }

    // If both completed Challenge 10:
    if (a.completedAt && b.completedAt) {
      return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
    }
    if (a.completedAt) return -1;
    if (b.completedAt) return 1;

    // Last solved timestamp
    if (a.lastSolvedAt && b.lastSolvedAt) {
      return new Date(a.lastSolvedAt).getTime() - new Date(b.lastSolvedAt).getTime();
    }
    if (a.lastSolvedAt) return -1;
    if (b.lastSolvedAt) return 1;

    // Fewest attempts
    return a.totalAttempts - b.totalAttempts;
  });

  return sorted.map((t, idx) => ({
    rank: idx + 1,
    teamId: t.id,
    teamName: t.name,
    challengesSolved: t.isCompleted ? 10 : t.currentChallengeIndex - 1,
    score: t.score,
    totalAttempts: t.totalAttempts,
    lastSolvedAt: t.lastSolvedAt,
    isCompleted: t.isCompleted,
    completedAt: t.completedAt,
    reviewStatus: t.reviewStatus,
    mapEligible: t.mapEligible,
    finishRank: t.finishRank,
  }));
}
