export type UserRole = 'participant' | 'organizer';

export type ReviewStatus = 'none' | 'pending' | 'approved' | 'rejected';

export type EventStatus = 'upcoming' | 'active' | 'paused' | 'ended';

export type ChallengeCategory = 
  | 'Cipher & Decoding'
  | 'Network Analysis'
  | 'Steganography'
  | 'Reverse Engineering'
  | 'CTF Flag'
  | 'Web & Database'
  | 'Cryptographic Hash'
  | 'Logic & Parity';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface Team {
  id: string;
  name: string;
  username: string;
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
}

export interface ParticipantChallenge {
  id: number;
  title: string;
  category: ChallengeCategory;
  difficulty: DifficultyLevel;
  points: number;
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
  durationMinutes: number; // 90 minutes
  startTime: string | null; // ISO timestamp
  endTime: string | null; // ISO timestamp
  venueName: string;
  venueRoom: string;
  mapQuota: number; // 6
  hintsAllowed: boolean;
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

export interface VenueMapData {
  accessGranted: boolean;
  teamName: string;
  finishRank: number;
  venueName: string;
  venueRoom: string;
  revealedAt: string;
  secretExtractionCode: string;
  mapCoordinates: string;
  mapSvg: string;
  instructions: string[];
}
