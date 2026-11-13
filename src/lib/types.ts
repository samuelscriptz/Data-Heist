export type UserRole = 'participant' | 'organizer';

export type ReviewStatus = 'none' | 'pending' | 'approved' | 'rejected';

export type EventStatus = 'upcoming' | 'active' | 'paused' | 'ended';

export type LobbyStatus = 'pending_admission' | 'admitted' | 'in_game' | 'rejected';

export type ActivityEventType = 
  | 'join_lobby'
  | 'admitted'
  | 'game_start'
  | 'node_solved'
  | 'wrong_answer'
  | 'hint_unlocked'
  | 'completed'
  | 'reconnect_requested'
  | 'reconnect_approved'
  | 'team_kicked';

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: ActivityEventType;
  teamId: string;
  teamName: string;
  challengeId?: number;
  message: string;
  pointsDelta?: number;
}

export type ChallengeCategory = 
  | 'Decrypting'
  | 'Puzzle'
  | 'CTF Flag'
  | 'Cipher & Decoding'
  | 'Network Analysis'
  | 'Steganography'
  | 'Reverse Engineering'
  | 'Web & Database'
  | 'Cryptographic Hash'
  | 'Logic & Parity';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface Team {
  id: string;
  name: string;
  username: string;
  lobbyStatus: LobbyStatus;
  activeSessionId: string | null;
  reconnectPending: boolean;
  reconnectRequestedAt: string | null;
  reconnectSessionId: string | null;
  currentChallengeIndex: number; // 1 to 10 (11 means all solved)
  isCompleted: boolean;
  completedAt: string | null; // ISO timestamp from server clock
  reviewStatus: ReviewStatus;
  reviewedAt: string | null;
  reviewedBy: string | null;
  mapEligible: boolean; // True only for first 6 approved teams
  finishRank: number | null; // 1 to 6 (or > 6 if approved later)
  score: number;
  totalAttempts: number;
  lastSolvedAt: string | null;
  createdAt: string;
  startedAt: string | null; // null until game begins
  timerEndTime: string | null; // startedAt + 20 minutes
  durationMinutes: number; // default 20
}

export interface ParticipantChallenge {
  id: number;
  title: string;
  category: ChallengeCategory;
  difficulty: DifficultyLevel;
  points: number;
  hintCost: number; // Exactly 50% of points (e.g. 150 pts -> 75 pts)
  description: string;
  clue: string;
  artifactType: 'hex' | 'network_packet' | 'code' | 'cipher_stream' | 'terminal_log' | 'steganography';
  artifactContent: string;
  answerFormatHint: string;
  hasHint: boolean;
  hintPenaltySeconds: number;
  isUnlocked: boolean;
  isSolved: boolean;
  hintRevealed?: string | null;
}

export interface ServerChallenge extends ParticipantChallenge {
  acceptedAnswers: string[]; // Normalized lowercase/trimmed
  answerHashSha256: string;
  hintText: string;
  caseSensitive?: boolean;
}

export interface SubmissionRecord {
  id: string;
  teamId: string;
  teamName: string;
  challengeId: number;
  submittedAnswer: string;
  isCorrect: boolean;
  submittedAt: string;
}

export interface EventConfig {
  id: string;
  name: string;
  status: EventStatus;
  gameStarted: boolean;
  gameStartedAt: string | null;
  gameEndTime: string | null;
  durationMinutes: number; // 20 minutes
  startTime: string | null; // ISO timestamp
  endTime: string | null; // ISO timestamp
  venueName: string;
  venueRoom: string;
  mapQuota: number; // 6
  hintsAllowed: boolean;
  pausedRemainingSeconds?: number | null;
}

export interface LeaderboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  challengesSolved: number;
  score: number;
  totalAttempts: number;
  lastSolvedAt: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  reviewStatus: ReviewStatus;
  mapEligible: boolean;
  finishRank: number | null;
}

export interface AuthSession {
  userId: string;
  username: string;
  displayName: string;
  role: UserRole;
  teamId?: string;
  teamName?: string;
}

export interface FloorMapInfo {
  floorNumber: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  clueZone: string;
}

export interface VenueMapData {
  accessGranted: boolean;
  teamName: string;
  finishRank: number | null;
  venueName: string;
  venueRoom: string;
  revealedAt: string;
  secretExtractionCode: string;
  mapCoordinates: string;
  mapSvg?: string;
  floors?: FloorMapInfo[];
  instructions: string[];
}
