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
  description: string;
  icon: string;
  completed: boolean;
}

export interface ChallengeProgress {
  [taskId: string]: boolean;
}

export interface Rewards {
  points: number;
  discounts: Discount[];
}

export interface Discount {
  brand: string;
  amount: string;
} 