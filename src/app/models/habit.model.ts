export interface Habit {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'health' | 'fitness' | 'mindfulness' | 'nutrition' | 'learning' | 'productivity';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  target: number;
  unit: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  isChallengeHabit: boolean;
  completionStatus: { [date: string]: 'completed' | 'partial' };
  streak: {
    current: number;
    max: number;
    best: number;
  };
  progress: { [date: string]: number };
  dayLimit?: number; // Ліміт днів для звички
  isCompleted?: boolean; // Чи завершена звичка
  completedDate?: string; // Дата завершення
} 