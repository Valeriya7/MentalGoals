export interface Habit {
  id: string;
  name: {
    uk: string;
    en: string;
    de: string;
  };
  description: {
    uk: string;
    en: string;
    de: string;
  };
  icon: string;
  category: string;
  difficulty: string;
  points: number;
  isActive: boolean;
  isChallengeHabit: boolean;
  isBaseHabit: boolean;
  completionStatus: Record<string, boolean>;
  streak: {
    current: number;
    max: number;
  };
  target: number;
  unit: string;
  frequency: string;
  progress: Record<string, number>;
} 