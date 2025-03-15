export interface Challenge {
  id: string;
  title: string;
  description: string;
  duration: number;
  status: 'active' | 'completed';
  currentDay?: number;
  startDate?: string;
  endDate?: string;
  tasks: ChallengeTask[];
  rewards: Rewards;
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