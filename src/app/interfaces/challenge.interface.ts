export interface ChallengeTask {
  id: string;
  name: string;
  description: string;
  icon: string;
  completed: boolean;
  reminderTime?: string;
  reminderEnabled: boolean;
  daysCompleted: {
    [date: string]: boolean;
  };
}

export interface Challenge {
  id: string;
  name: string;
  currentDay: number;
  totalDays: number;
  tasks: ChallengeTask[];
  rewards: {
    points: number;
    discounts: Array<{
      brand: string;
      amount: string;
    }>;
  };
  startDate: string;
  endDate: string;
} 