export interface Challenge {
  id: string;
  title: string;
  description: string;
  phases: ChallengePhase[];
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'failed';
  progress: ChallengeProgress;
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
  completed: boolean;
  icon?: string;
}

export interface ChallengeProgress {
  currentDay: number;
  totalDays: number;
  completedTasks: number;
  totalTasks: number;
} 