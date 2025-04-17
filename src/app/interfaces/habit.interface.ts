export interface Habit {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'health' | 'fitness' | 'mindfulness' | 'nutrition' | 'learning' | 'productivity';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  isActive: boolean;
  isChallengeHabit: boolean;
  isBaseHabit?: boolean;
  completionStatus: { [key: string]: 'completed' | 'partial' | 'not_completed' };
  streak: {
    current: number;
    best: number;
  };
  target: number;
  unit: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  challengeId?: number;
  reminder?: {
    time: string;
    days: string[];
  };
  progress: {
    [date: string]: boolean;
  };
  createdAt?: Date;
  activationDate?: Date;
} 