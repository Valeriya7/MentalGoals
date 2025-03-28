export interface Challenge {
  id: string;
  title: string;
  description: string;
  duration: number;
  tasks: ChallengeTask[];
  status: 'active' | 'completed' | 'available' | 'failed';
  startDate?: string;
  endDate?: string;
  currentDay?: number;
  completedDate?: string;
  rewards: {
    points: number;
    discounts: {
      brand: string;
      amount: string;
    }[];
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  difficultyLevel: number; // 1-5, де 1 - найлегший, 5 - найскладніший
  progress?: {
    [date: string]: ChallengeProgress;
  };
  phases: ChallengePhase[];
}

export interface ChallengePhase {
  id: string;
  title: string;
  tasks: ChallengeTask[];
  startDate: string;
  endDate: string;
}

export interface ChallengeTask {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  completed: boolean;
  progress: number;
  type?: string;
  duration?: number;
}

export interface TaskProgress {
  completed: boolean;
  completedAt: string | null;
  progress: number;
  date: string;
}

export interface DayProgress {
  date: string;
  tasks: { [taskId: string]: TaskProgress };
  completedTasks: number;
  totalTasks: number;
  lastUpdated: string;
}

export interface ChallengeProgress {
  date: string;
  tasks: { [taskId: string]: TaskProgress };
  completedTasks: number;
  totalTasks: number;
  lastUpdated: string;
  taskDetails?: Array<{
    taskId: string;
    title: string;
    completedAt?: string | null;
  }>;
}

export interface Rewards {
  points: number;
  discounts: Discount[];
}

export interface Discount {
  brand: string;
  amount: string;
} 