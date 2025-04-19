import { TaskProgress } from './challenge.interface';

export interface HabitProgress {
  periodProgress: Array<{
    progressDate: string;
    completedTasks: number;
    totalTasks: number;
  }>;
  category: string;
  progress: Record<string, number>;
  isActive: boolean;
}

export interface DiaryEntry {
  date: Date;
  mood: number;
  sleep: number;
}

export interface DayInfo {
  name: string;
  date: string;
  marked: boolean;
  fullDate: Date;
}

export interface DailyTask {
  name: string;
  icon: string;
  completed: boolean;
  title: string;
  description?: string;
  challengeId?: string;
  challengeTitle?: string;
}

export interface EmotionalState {
  id: string;
  date: Date;
  mood: number;
  energy: number;
}

export interface ChallengeProgress {
  date: string;
  tasks: Record<string, TaskProgress>;
  completedTasks: number;
  totalTasks: number;
  lastUpdated: string;
} 