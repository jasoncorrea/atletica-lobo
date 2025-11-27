export interface Competition {
  id: string;
  name: string;
  year: number;
  isActive: boolean; // Defines which competition is currently being managed in Admin
  createdAt: number;
}

export interface Athletic {
  id: string;
  name: string;
  logoUrl: string | null;
}

export interface Modality {
  id: string;
  competitionId: string;
  name: string;
  gender: 'M' | 'F' | 'Misto';
  status: 'pending' | 'finished';
}

export interface ScoreRule {
  // Array of points for 1st, 2nd, 3rd... 8th place
  points: number[]; 
}

// By default: [12, 9, 7, 5, 4, 3, 2, 1]
export const DEFAULT_SCORE_RULE: number[] = [12, 9, 7, 5, 4, 3, 2, 1];

export interface Result {
  id: string;
  modalityId: string;
  competitionId: string;
  // Map of Rank (1-8) to Athletic ID
  ranking: { [rank: number]: string };
}

export interface Penalty {
  id: string;
  competitionId: string;
  athleticId: string;
  points: number;
  reason: string;
  date: number;
}

export interface LeaderboardEntry {
  athleticId: string;
  name: string;
  logoUrl: string | null;
  totalPoints: number;
  penalties: number;
  rawPoints: number;
  position: number;
}

export interface AppConfig {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
}