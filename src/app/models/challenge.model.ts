export interface Challenge {
  id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  difficultyLevel: number;
  tasks: Task[];
  status: 'available' | 'active' | 'completed';
  startDate?: string;
  endDate?: string;
  completedDate?: string;
  rewards: {
    points: number;
    discounts: {
      amount: number;
      brand: string;
    }[];
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
} 