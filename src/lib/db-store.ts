import { 
  Team, 
  EventConfig, 
  SubmissionRecord, 
  LeaderboardEntry, 
  VenueMapData,
  AuthSession,
  ActivityEvent,
  LobbyStatus,
  ReviewStatus
} from './types';
import { SERVER_CHALLENGES } from './challenges-data';

// Singleton in-memory state engine (persists across API requests in server process)
// Seamlessly mirrors Supabase schema and functions so the app runs out-of-the-box
// while also providing full Supabase integration when configured.

interface MemoryStore {
  teams: Map<string, Team>;
  teamPasswords: Map<string, string>; // username -> password (for admin)
  submissions: SubmissionRecord[];
  hintsUnlocked: Map<string, Set<number>>; // teamId -> Set<challengeId>
  eventConfig: EventConfig;
  rateLimitMap: Map<string, { lastAttempt: number; count: number }>;
  sessions: Map<string, AuthSession>; // token -> session
  activityFeed: ActivityEvent[];
}

// Global scope initialization for Next.js hot-reloads
const globalForStore = globalThis as unknown as {
  __DATA_HEIST_STORE__?: MemoryStore;
};

function initializeStore(): MemoryStore {
  const teams = new Map<string, Team>();
  const teamPasswords = new Map<string, string>();

  // Pre-seed organizer credentials
  teamPasswords.set('admin', 'admin2026!');
  teamPasswords.set('organizer@dataheist.internal', 'admin2026!');

  // Initial event configuration (starts when admin clicks Start in Organizer console)
  const eventConfig: EventConfig = {
    id: 'main',
    name: 'DATA HEIST 2026',
    status: 'upcoming',
    gameStarted: false,
    gameStartedAt: null,
    gameEndTime: null,
    durationMinutes: 20,
    startTime: null,
    endTime: null,
    venueName: 'Advanced Programming Lab',
    venueRoom: 'VOC Block — Lab 304',
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
    activityFeed: [
      {
        id: `act-init-1`,
        timestamp: new Date().toISOString(),
        type: 'join_lobby',
        teamId: 'system',
        teamName: 'SYSTEM MAINFRAME',
        message: 'Mainframe initialized in Waiting Room Lobby mode. Awaiting team connections.',
      }
    ],
  };
}

export const db = globalForStore.__DATA_HEIST_STORE__ ?? initializeStore();
if (process.env.NODE_ENV !== 'production') {
  globalForStore.__DATA_HEIST_STORE__ = db;
}

// ==================== ACTIVITY LOGGING ====================

export function logActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>): ActivityEvent {
  const newEvent: ActivityEvent = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...event,
  };
  db.activityFeed.unshift(newEvent);
  if (db.activityFeed.length > 250) {
    db.activityFeed.pop();
  }
  return newEvent;
}

export function getActivityFeed(limit = 60): ActivityEvent[] {
  return db.activityFeed.slice(0, limit);
}

// ==================== AUTH & SESSION METHODS ====================

export function authenticateAdmin(username: string, pass: string): AuthSession | null {
  const cleanUser = username.trim().toLowerCase();
  const storedPass = db.teamPasswords.get(cleanUser);

  if (!storedPass || storedPass !== pass) {
    return null;
  }

  if (cleanUser === 'admin' || cleanUser === 'organizer@dataheist.internal') {
    return {
      userId: 'organizer-admin',
      username: cleanUser,
      displayName: 'Lead Proctor [Organizer]',
      role: 'organizer',
    };
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

// ==================== MENTIMETER-STYLE LOBBY & RECONNECTION ====================

export function joinLobby(teamName: string, sessionId: string): {
  success: boolean;
  team?: Team;
  alreadyActive?: boolean;
  status?: LobbyStatus;
  gameStarted?: boolean;
  message: string;
} {
  const trimmed = teamName.trim();
  if (!trimmed) {
    return { success: false, message: 'Please provide a valid team codename.' };
  }

  // Check if team exists (case-insensitive)
  const existing = Array.from(db.teams.values()).find(
    t => t.name.toLowerCase() === trimmed.toLowerCase()
  );

  const now = new Date().toISOString();

  if (existing) {
    // 1. Same device / session returns:
    if (existing.activeSessionId === sessionId) {
      return {
        success: true,
        team: existing,
        status: existing.lobbyStatus,
        gameStarted: db.eventConfig.gameStarted,
        message: `Welcome back, Operative ${existing.name}.`,
      };
    }

    // 2. Different session trying to join an already in-game / active team:
    if (existing.lobbyStatus === 'in_game' || existing.isCompleted) {
      return {
        success: false,
        alreadyActive: true,
        team: existing,
        status: existing.lobbyStatus,
        gameStarted: db.eventConfig.gameStarted,
        message: `Team "${existing.name}" is already in-game at Node #${existing.currentChallengeIndex}. If your team was disconnected by mistake, click Request Reconnection for host verification.`,
      };
    }

    // 3. Different session joining a team still in waiting room before game start:
    // Rebind session to this device
    existing.activeSessionId = sessionId;
    return {
      success: true,
      team: existing,
      status: existing.lobbyStatus,
      gameStarted: db.eventConfig.gameStarted,
      message: `Joined lobby queue as "${existing.name}". Waiting for host admission.`,
    };
  }

  // 4. Create brand new team
  const id = `team-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const slug = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const newTeam: Team = {
    id,
    name: trimmed,
    username: slug,
    lobbyStatus: 'pending_admission',
    activeSessionId: sessionId,
    reconnectPending: false,
    reconnectRequestedAt: null,
    reconnectSessionId: null,
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
    createdAt: now,
    startedAt: null,
    timerEndTime: null,
    durationMinutes: 20,
  };

  db.teams.set(id, newTeam);
  logActivity({
    type: 'join_lobby',
    teamId: id,
    teamName: trimmed,
    message: `Team "${trimmed}" entered the waiting room lobby.`,
  });

  return {
    success: true,
    team: newTeam,
    status: 'pending_admission',
    gameStarted: db.eventConfig.gameStarted,
    message: `Team "${trimmed}" registered. Waiting for host admission.`,
  };
}

export function requestTeamReconnection(teamId: string, newSessionId: string): {
  success: boolean;
  message: string;
} {
  const team = db.teams.get(teamId);
  if (!team) return { success: false, message: 'Team identity not found.' };

  team.reconnectPending = true;
  team.reconnectRequestedAt = new Date().toISOString();
  team.reconnectSessionId = newSessionId;

  logActivity({
    type: 'reconnect_requested',
    teamId: team.id,
    teamName: team.name,
    message: `Team "${team.name}" flagged an in-game disconnect and requested device re-authorization.`,
  });

  return {
    success: true,
    message: `Reconnection request logged for "${team.name}". Please confirm with the lead proctor at the desk.`,
  };
}

export function approveTeamReconnection(teamId: string): {
  success: boolean;
  message: string;
} {
  const team = db.teams.get(teamId);
  if (!team) return { success: false, message: 'Team identity not found.' };

  if (team.reconnectSessionId) {
    team.activeSessionId = team.reconnectSessionId;
    
    // Bind session in memory store
    const existingSession = db.sessions.get(team.reconnectSessionId);
    if (existingSession) {
      existingSession.teamId = team.id;
      existingSession.teamName = team.name;
      existingSession.role = 'participant';
    } else {
      db.sessions.set(team.reconnectSessionId, {
        userId: team.id,
        username: team.username,
        displayName: team.name,
        role: 'participant',
        teamId: team.id,
        teamName: team.name,
      });
    }
  }

  team.reconnectPending = false;
  team.reconnectSessionId = null;
  team.reconnectRequestedAt = null;

  logActivity({
    type: 'reconnect_approved',
    teamId: team.id,
    teamName: team.name,
    message: `Proctor certified and restored session for Team "${team.name}" at Node #${team.currentChallengeIndex}.`,
  });

  return {
    success: true,
    message: `Team "${team.name}" session restored successfully.`,
  };
}

export function admitTeam(teamId: string): { success: boolean; message: string } {
  const team = db.teams.get(teamId);
  if (!team) return { success: false, message: 'Team not found.' };

  const isStarted = db.eventConfig.gameStarted;
  const now = new Date().toISOString();
  const effectiveEnd = db.eventConfig.gameEndTime || db.eventConfig.endTime;

  if (isStarted) {
    // If the game has already commenced, admitting the team immediately puts them in-game
    // synchronized with the active countdown clock!
    team.lobbyStatus = 'in_game';
    team.startedAt = db.eventConfig.gameStartedAt || now;
    team.timerEndTime = effectiveEnd;
    team.durationMinutes = db.eventConfig.durationMinutes || 20;

    logActivity({
      type: 'admitted',
      teamId: team.id,
      teamName: team.name,
      message: `Proctor admitted Team "${team.name}" directly into active game (Node #${team.currentChallengeIndex}).`,
    });

    return { success: true, message: `Team "${team.name}" admitted directly into active game.` };
  } else {
    team.lobbyStatus = 'admitted';

    logActivity({
      type: 'admitted',
      teamId: team.id,
      teamName: team.name,
      message: `Proctor admitted Team "${team.name}" into the waiting room.`,
    });

    return { success: true, message: `Team "${team.name}" admitted.` };
  }
}

export function admitAllTeams(): { success: boolean; count: number; message: string } {
  let count = 0;
  const isStarted = db.eventConfig.gameStarted;
  const now = new Date().toISOString();
  const effectiveEnd = db.eventConfig.gameEndTime || db.eventConfig.endTime;

  for (const team of db.teams.values()) {
    if (team.lobbyStatus === 'pending_admission') {
      if (isStarted) {
        team.lobbyStatus = 'in_game';
        team.startedAt = db.eventConfig.gameStartedAt || now;
        team.timerEndTime = effectiveEnd;
        team.durationMinutes = db.eventConfig.durationMinutes || 20;
      } else {
        team.lobbyStatus = 'admitted';
      }
      count++;
    }
  }

  logActivity({
    type: 'admitted',
    teamId: 'all',
    teamName: 'ALL TEAMS',
    message: isStarted
      ? `Proctor batch-admitted all ${count} pending team(s) directly into active game.`
      : `Proctor batch-admitted all ${count} pending team(s) into the waiting room.`,
  });

  return { success: true, count, message: `Admitted ${count} pending team(s).` };
}

export function kickTeam(teamId: string): { success: boolean; message: string } {
  const team = db.teams.get(teamId);
  if (!team) return { success: false, message: 'Team not found.' };

  logActivity({
    type: 'team_kicked',
    teamId: team.id,
    teamName: team.name,
    message: `Team "${team.name}" was removed from the lobby by proctor.`,
  });

  db.teams.delete(teamId);
  return { success: true, message: `Team "${team.name}" removed.` };
}

export function startGlobalGame(): {
  success: boolean;
  startedCount: number;
  message: string;
  endTime: string;
} {
  const now = new Date();
  const duration = db.eventConfig.durationMinutes || 20;
  const endTime = new Date(now.getTime() + duration * 60 * 1000);
  const isoEnd = endTime.toISOString();
  const isoNow = now.toISOString();

  db.eventConfig.gameStarted = true;
  db.eventConfig.gameStartedAt = isoNow;
  db.eventConfig.startTime = isoNow;
  db.eventConfig.gameEndTime = isoEnd;
  db.eventConfig.endTime = isoEnd;
  db.eventConfig.status = 'active';
  db.eventConfig.pausedRemainingSeconds = null;

  let startedCount = 0;
  for (const team of db.teams.values()) {
    // Both admitted and pending teams transition to in_game upon global host start
    if (team.lobbyStatus === 'admitted' || team.lobbyStatus === 'pending_admission') {
      team.lobbyStatus = 'in_game';
      team.startedAt = isoNow;
      team.timerEndTime = isoEnd;
      team.durationMinutes = duration;
      startedCount++;
    }
  }

  logActivity({
    type: 'game_start',
    teamId: 'global',
    teamName: 'ALL TEAMS',
    message: `PROCTOR INITIATED OPERATION DATA HEIST! 20-Minute authoritative countdown clock is now running for ${startedCount} teams.`,
  });

  return {
    success: true,
    startedCount,
    endTime: isoEnd,
    message: `Operation Data Heist commenced for ${startedCount} teams!`,
  };
}

export function pauseGlobalGame(): { success: boolean; message: string; remainingSeconds: number } {
  if (db.eventConfig.status === 'paused') {
    return { 
      success: true, 
      message: 'Event timer is already paused.', 
      remainingSeconds: db.eventConfig.pausedRemainingSeconds || 0 
    };
  }

  const now = Date.now();
  let remaining = (db.eventConfig.durationMinutes || 20) * 60;
  const effectiveEnd = db.eventConfig.gameEndTime || db.eventConfig.endTime;
  if (effectiveEnd) {
    const end = new Date(effectiveEnd).getTime();
    remaining = Math.max(0, Math.floor((end - now) / 1000));
  }

  db.eventConfig.status = 'paused';
  db.eventConfig.pausedRemainingSeconds = remaining;

  logActivity({
    type: 'game_start',
    teamId: 'global',
    teamName: 'ALL TEAMS',
    message: `PROCTOR PAUSED THE EVENT. Countdown frozen with ${Math.floor(remaining / 60)}m ${remaining % 60}s remaining.`,
  });

  return { 
    success: true, 
    message: 'Event countdown paused.', 
    remainingSeconds: remaining 
  };
}

export function resumeGlobalGame(): { success: boolean; message: string; endTime: string } {
  if (db.eventConfig.status !== 'paused') {
    return { 
      success: true, 
      message: 'Event timer is not paused.', 
      endTime: db.eventConfig.gameEndTime || db.eventConfig.endTime || '' 
    };
  }

  const now = Date.now();
  const remaining = db.eventConfig.pausedRemainingSeconds ?? ((db.eventConfig.durationMinutes || 20) * 60);
  const newEndTime = new Date(now + remaining * 1000).toISOString();

  db.eventConfig.status = 'active';
  db.eventConfig.gameEndTime = newEndTime;
  db.eventConfig.endTime = newEndTime;
  db.eventConfig.pausedRemainingSeconds = null;

  for (const team of db.teams.values()) {
    if (team.lobbyStatus === 'in_game' && !team.isCompleted) {
      team.timerEndTime = newEndTime;
    }
  }

  logActivity({
    type: 'game_start',
    teamId: 'global',
    teamName: 'ALL TEAMS',
    message: `PROCTOR RESUMED THE EVENT. Countdown running with new deadline: ${new Date(newEndTime).toLocaleTimeString()}.`,
  });

  return { success: true, message: 'Event timer resumed.', endTime: newEndTime };
}

// ==================== TEAM & PROGRESS METHODS ====================

export function getTeam(teamId: string): Team | null {
  return db.teams.get(teamId) || null;
}

export function getAllTeams(): Team[] {
  return Array.from(db.teams.values());
}

export function startTeamChallenge(teamId: string, durationMinutes: number = 20): {
  success: boolean;
  message: string;
} {
  const team = db.teams.get(teamId);
  if (!team) return { success: false, message: 'Team not found.' };

  if (!team.startedAt) {
    const now = new Date();
    const end = new Date(now.getTime() + durationMinutes * 60 * 1000);
    team.startedAt = now.toISOString();
    team.timerEndTime = end.toISOString();
    team.durationMinutes = durationMinutes;
    team.lobbyStatus = 'in_game';
  }

  return { success: true, message: 'Challenge timer activated.' };
}

export function getLeaderboard(): Array<{
  rank: number;
  teamId: string;
  name: string;
  score: number;
  currentChallengeIndex: number;
  isCompleted: boolean;
  completedAt: string | null;
  totalAttempts: number;
  reviewStatus: ReviewStatus;
  mapEligible: boolean;
}> {
  const sorted = Array.from(db.teams.values())
    .sort((a, b) => {
      if (a.isCompleted && !b.isCompleted) return -1;
      if (!a.isCompleted && b.isCompleted) return 1;

      const aSolved = a.isCompleted ? 10 : a.currentChallengeIndex - 1;
      const bSolved = b.isCompleted ? 10 : b.currentChallengeIndex - 1;
      if (aSolved !== bSolved) return bSolved - aSolved;

      if (b.score !== a.score) return b.score - a.score;
      if (a.totalAttempts !== b.totalAttempts) return a.totalAttempts - b.totalAttempts;

      const aTime = a.completedAt || a.lastSolvedAt || a.createdAt;
      const bTime = b.completedAt || b.lastSolvedAt || b.createdAt;
      return new Date(aTime).getTime() - new Date(bTime).getTime();
    });

  return sorted.map((t, index) => ({
    rank: index + 1,
    teamId: t.id,
    name: t.name,
    score: t.score,
    currentChallengeIndex: t.currentChallengeIndex,
    isCompleted: t.isCompleted,
    completedAt: t.completedAt,
    totalAttempts: t.totalAttempts,
    reviewStatus: t.reviewStatus,
    mapEligible: t.mapEligible,
  }));
}

export function getTeamRemainingSeconds(team: Team): number {
  if (db.eventConfig.status === 'paused') {
    return db.eventConfig.pausedRemainingSeconds ?? ((team.durationMinutes || 20) * 60);
  }

  const endTime = team.timerEndTime || db.eventConfig.gameEndTime || db.eventConfig.endTime;
  if (!endTime) {
    return (team.durationMinutes || 20) * 60;
  }
  const end = new Date(endTime).getTime();
  const diff = Math.floor((end - Date.now()) / 1000);
  return Math.max(0, diff);
}

export function isTeamTimeExpired(team: Team): boolean {
  if (db.eventConfig.status === 'paused') {
    return false;
  }
  if (!db.eventConfig.gameStarted && !team.startedAt) {
    return false;
  }
  return getTeamRemainingSeconds(team) <= 0;
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

// Clean and normalize answers for server evaluation (UPPERCASE)
export function normalizeAnswer(input: string): string {
  return input
    .trim()
    .toUpperCase()
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

  // Authoritative check: Game must be started by host!
  if (!db.eventConfig.gameStarted && !team.startedAt) {
    return { 
      success: false, 
      correct: false, 
      message: 'Challenge not started yet. Waiting for host to commence Operation Data Heist.' 
    };
  }

  // Authoritative check: 20-minute timer must not be expired!
  if (isTeamTimeExpired(team)) {
    return { 
      success: false, 
      correct: false, 
      message: 'Challenge time expired! The 20-minute symposium window has concluded.' 
    };
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
      message: 'All 10 challenges already solved. Awaiting proctor clearance.' 
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
    logActivity({
      type: 'wrong_answer',
      teamId: team.id,
      teamName: team.name,
      challengeId,
      message: `Team "${team.name}" failed verification on Node #${challengeId}.`,
    });

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
    team.currentChallengeIndex = 11;
    team.isCompleted = true;
    team.completedAt = new Date().toISOString();
    team.reviewStatus = 'pending'; // Organizer review gate
    
    logActivity({
      type: 'completed',
      teamId: team.id,
      teamName: team.name,
      challengeId: 10,
      pointsDelta: challenge.points,
      message: `MAINFRAME BREACHED! Team "${team.name}" completed all 10 nodes. Awaiting proctor clearance.`,
    });

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
    logActivity({
      type: 'node_solved',
      teamId: team.id,
      teamName: team.name,
      challengeId,
      pointsDelta: challenge.points,
      message: `Team "${team.name}" solved Node #${challengeId}: ${challenge.title} (+${challenge.points} pts).`,
    });

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

  if (!db.eventConfig.gameStarted && !team.startedAt) {
    return { success: false, message: 'Challenge has not been started by the host yet.' };
  }

  if (isTeamTimeExpired(team)) {
    return { success: false, message: 'Challenge time expired! The 20-minute countdown has concluded.' };
  }

  if (challengeId !== team.currentChallengeIndex) {
    return { success: false, message: 'Can only unlock hints for current active challenge.' };
  }

  const challenge = SERVER_CHALLENGES.find(c => c.id === challengeId);
  if (!challenge || !challenge.hasHint) {
    return { success: false, message: 'No hint available for this node.' };
  }

  const hintPenalty = challenge.hintCost ?? Math.floor(challenge.points / 2);

  let unlockedSet = db.hintsUnlocked.get(teamId);
  if (!unlockedSet) {
    unlockedSet = new Set();
    db.hintsUnlocked.set(teamId, unlockedSet);
  }

  if (!unlockedSet.has(challengeId)) {
    unlockedSet.add(challengeId);
    // Apply dynamic 50% penalty to score
    team.score = Math.max(0, team.score - hintPenalty);
    
    logActivity({
      type: 'hint_unlocked',
      teamId: team.id,
      teamName: team.name,
      challengeId,
      pointsDelta: -hintPenalty,
      message: `Team "${team.name}" unlocked hint on Node #${challengeId} (-${hintPenalty} pts).`,
    });
  }

  return {
    success: true,
    hint: challenge.hintText,
    message: `Hint unlocked. ${hintPenalty} point security penalty (50%) applied.`,
  };
}

export function getUnlockedHint(teamId: string, challengeId: number): string | null {
  const set = db.hintsUnlocked.get(teamId);
  if (!set || !set.has(challengeId)) return null;
  const challenge = SERVER_CHALLENGES.find(c => c.id === challengeId);
  return challenge?.hintText || null;
}

// ==================== SECURE ATOMIC APPROVAL FOR TOP 6 ====================

let isApprovingLock = false;

export async function approveTeamCompletion(
  teamId: string, 
  organizerId: string
): Promise<{ success: boolean; mapEligible: boolean; rank: number; message: string }> {
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

    const approvedWithMap = Array.from(db.teams.values())
      .filter(t => t.reviewStatus === 'approved' && t.mapEligible);

    const mapQuota = db.eventConfig.mapQuota || 6;
    const now = new Date().toISOString();

    team.reviewStatus = 'approved';
    team.reviewedAt = now;
    team.reviewedBy = organizerId;

    if (approvedWithMap.length < mapQuota) {
      team.mapEligible = true;
      team.finishRank = approvedWithMap.length + 1;

      logActivity({
        type: 'admitted',
        teamId: team.id,
        teamName: team.name,
        message: `PODIUM CONFIRMED: Team "${team.name}" approved for Venue Map access (Rank #${team.finishRank} of ${mapQuota}).`,
      });

      return {
        success: true,
        mapEligible: true,
        rank: team.finishRank,
        message: `Approval confirmed. Team qualified for Venue Map reveal (Rank #${team.finishRank} of ${mapQuota}).`,
      };
    } else {
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
  // 1. Completely remove all registered teams (wipes leaderboards and queues)
  db.teams.clear();

  // 2. Clear all submissions, hints, rate limits
  db.submissions = [];
  db.hintsUnlocked.clear();
  db.rateLimitMap.clear();

  // 3. Clear participant sessions (keep organizer logged in)
  for (const [token, session] of db.sessions.entries()) {
    if (session.role === 'participant') {
      db.sessions.delete(token);
    }
  }

  // 4. Reset event configuration and timers back to clean 20-minute upcoming state
  db.eventConfig.durationMinutes = 20;
  db.eventConfig.gameStarted = false;
  db.eventConfig.gameStartedAt = null;
  db.eventConfig.gameEndTime = null;
  db.eventConfig.startTime = null;
  db.eventConfig.endTime = null;
  db.eventConfig.pausedRemainingSeconds = null;
  db.eventConfig.status = 'upcoming';

  db.activityFeed = [
    {
      id: `act-reset-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'game_start',
      teamId: 'system',
      teamName: 'SYSTEM MAINFRAME',
      message: 'Full event reset executed by proctor. All teams and leaderboards cleared. Ready for fresh 20-minute run.',
    }
  ];

  return { success: true, message: 'Event reset successfully. All teams and leaderboards cleared. Timer reset to 20:00.' };
}

// ==================== VENUE MAP AUTHORITATIVE ACCESS CHECK ====================

export function getVenueMapForTeam(teamId: string): VenueMapData | null {
  const team = db.teams.get(teamId);
  if (!team) return null;

  // The participant must have completed all 10 challenges AND be approved by admin AND be map-eligible
  if (!team.isCompleted || team.reviewStatus !== 'approved' || !team.mapEligible) {
    return null;
  }

  const floors = [
    {
      floorNumber: 1,
      title: 'Floor 1 — VOC Ground Level Blueprint',
      subtitle: 'Main Entrance, Reception Desk & Primary Network Junction',
      imageUrl: '/floor 1.jpeg',
      clueZone: 'Floor 1 (Zone Alpha): Inspect the reception desk and primary electrical/network junction for Clue #1.',
    },
    {
      floorNumber: 2,
      title: 'Floor 2 — VOC Mid Level Blueprint',
      subtitle: 'Computer Laboratories & Central Corridor',
      imageUrl: '/floor 2.jpeg',
      clueZone: 'Floor 2 (Zone Beta): Search the central corridor laboratories and workstation lockers for Clue #2.',
    },
    {
      floorNumber: 3,
      title: 'Floor 3 — VOC Top Level Blueprint',
      subtitle: 'Advanced Programming Lab & Cyber Enclave (Lab 304)',
      imageUrl: '/floor 3.jpeg',
      clueZone: 'Floor 3 (Zone Omega): Breach the final server rack alcove in Lab 304 to locate Dropbox #3B and extract the Data Core Trophy.',
    },
  ];

  const finishRank = team.finishRank || (team.reviewStatus === 'approved' ? 1 : null);
  const secretCode = finishRank ? `DH-8842-OMEGA-${finishRank}` : 'DH-8842-OMEGA-VERIFIED';

  return {
    accessGranted: true,
    teamName: team.name,
    finishRank,
    venueName: 'Advanced Programming Lab (VOC Block)',
    venueRoom: 'Lab 304 — Floors 1, 2, and 3',
    revealedAt: new Date().toISOString(),
    secretExtractionCode: secretCode,
    mapCoordinates: 'VOC Block - Lab 304 - Rack Bay D - Container 3B',
    floors,
    instructions: [
      'Present this authorized blueprint display directly to the floor proctor.',
      'Only Floors 1, 2, and 3 are authorized. Floors 4 & 5 are strictly off-limits.',
      'Scan all 5 physical QR code markers in sequence and screenshot each for proctor verification.',
      'First approved team to locate Dropbox #3B claims the 2026 Data Core Trophy.',
    ],
  };
}
