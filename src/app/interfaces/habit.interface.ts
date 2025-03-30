export interface Habit {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: 'health' | 'fitness' | 'mindfulness' | 'nutrition' | 'learning' | 'productivity';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  isActive: boolean;
  isChallengeHabit: boolean;
  challengeId?: number;
  completionStatus: {
    [date: string]: 'completed' | 'partial' | 'not_completed';
  };
  streak: {
    current: number;
    best: number;
  };
  target: number;
  unit?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  reminder?: {
    time: string;
    days: string[];
  };
}

export interface DayActivity {
  date: string;
  habits: {
    id: number;
    name: string;
    status: 'completed' | 'partial' | 'not_completed';
    category: string;
  }[];
  challenges: {
    id: number;
    title: string;
    tasks: {
      id: string;
      title: string;
      completed: boolean;
    }[];
  }[];
} 