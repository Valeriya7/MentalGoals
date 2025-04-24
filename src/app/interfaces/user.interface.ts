export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  points: number;
  level: number;
  challenges: string[];
  completedChallenges: string[];
  activeChallenge: string | null;
  lastLogin: string;
} 