export interface Challenge {
  id: string;
  title: string;
  name?: {
    uk: string;
    en: string;
    de: string;
  };
  description: string;
  tasks: ChallengeTask[];
  startDate?: string;
  endDate?: string;
  completedDate?: string;
  status: 'active' | 'completed' | 'failed' | 'available';
  progress?: Record<string, DayProgress>;
  duration: number;
  currentDay?: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  difficultyLevel: number;
  rewards: {
    points: number;
    discounts: {
      brand: string;
      amount: string;
    }[];
  };
  phases: ChallengePhase[];
}

export interface ChallengeTask {
  id: string;
  title: string;
  description: string;
  icon?: string;
  completed: boolean;
  progress: number;
  type?: string;
  duration?: number;
}

export interface DayProgress {
  completedTasks: number;
  totalTasks: number;
  tasks: Record<string, TaskProgress>;
  date: string;
  lastUpdated: string;
}

export interface TaskProgress {
  completed: boolean;
  completedAt: string | null;
  progress: number;
}

export interface ChallengeProgress {
  date: string;
  tasks: Record<string, TaskProgress>;
  completedTasks: number;
  totalTasks: number;
  lastUpdated: string;
}

export interface ChallengePhase {
  id: string;
  title: string;
  tasks: ChallengeTask[];
  startDate: string;
  endDate: string;
}

export interface Rewards {
  points: number;
  discounts: Discount[];
}

export interface Discount {
  brand: string;
  amount: string;
} 