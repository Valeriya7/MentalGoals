import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Habit } from '../models/habit.model';
import { v4 as uuidv4 } from 'uuid';
import { Preferences } from '@capacitor/preferences';

interface HabitTranslation {
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
}

@Injectable({
  providedIn: 'root'
})
export class HabitService {
  private readonly STORAGE_KEY = 'habits';

  constructor(private storageService: StorageService) {}

  async getHabits(): Promise<Habit[]> {
    const { value } = await Preferences.get({ key: this.STORAGE_KEY });
    return value ? JSON.parse(value) : [];
  }

  async getHabitsProgress(startDate: Date, endDate: Date): Promise<{ date: string; completedTasks: number; totalTasks: number; progressPercentage: number }[]> {
    console.log('=== getHabitsProgress started ===');
    console.log('Start date:', startDate);
    console.log('End date:', endDate);

    const habits = await this.getHabits();
    console.log('All habits:', habits);

    const activeHabits = habits.filter(habit => habit.isActive);
    console.log('Active habits:', activeHabits);

    if (activeHabits.length === 0) {
      console.log('No active habits found');
      return [];
    }

    const result: { date: string; completedTasks: number; totalTasks: number; progressPercentage: number }[] = [];
    const currentDate = new Date(startDate);

    // Тестові дані для completionStatus
    const testCompletionStatus: Record<string, string> = {
      "2025-04-16": "completed",
      "2025-04-18": "completed",
      "2025-04-19": "completed",
      "2025-04-21": "completed",
      "2025-04-22": "completed",
      "2025-04-23": "completed",
      "2025-04-24": "completed",
      "2025-04-25": "completed"
    };

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      //console.log('\nProcessing date:', dateStr);

      // Рахуємо кількість виконаних звичок за день
      const completedTasks = activeHabits.reduce((sum, habit) => {
        const status = habit.completionStatus[dateStr];
        //console.log('Habit:', habit.name);
        //console.log('Status for', dateStr, ':', status);
        //console.log('Status type:', typeof status);

        // Перевіряємо статус виконання
        if (typeof status === 'boolean' && status === true) {
          //console.log('Found completed habit (boolean)');
          return sum + 1;
        }
        if (typeof status === 'string' && status === "completed") {
          //console.log('Found completed habit (string)');
          return sum + 1;
        }
        return sum;
      }, 0);

      //console.log('Completed tasks for', dateStr, ':', completedTasks);

      // Рахуємо загальний прогрес для всіх активних звичок
      const totalProgress = activeHabits.reduce((sum, habit) => {
        const progress = habit.progress[dateStr] || 0;
        const target = habit.target || 1;
        return sum + (progress / target);
      }, 0);

      // Розраховуємо відсоток прогресу
      const progressPercentage = activeHabits.length > 0 ? (totalProgress / activeHabits.length) * 100 : 0;

      result.push({
        date: dateStr,
        completedTasks,
        totalTasks: activeHabits.length,
        progressPercentage
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('=== getHabitsProgress finished ===');
    console.log('Final result:', result);
    return result;
  }

  async saveHabits(habits: Habit[]): Promise<void> {
    await Preferences.set({
      key: this.STORAGE_KEY,
      value: JSON.stringify(habits)
    });
  }

  async updateHabitProgress(habitId: string, date: string, progress: number): Promise<void> {
    try {
      const habits = await this.getHabits();
      const habitIndex = habits.findIndex(h => h.id === habitId);

      if (habitIndex !== -1) {
        habits[habitIndex].progress[date] = progress;
        await this.saveHabits(habits);
      }
    } catch (error) {
      console.error('Error updating habit progress:', error);
    }
  }

  async updateHabitCompletion(habitId: string, date: string, completed: boolean): Promise<void> {
    try {
      const habits = await this.getHabits();
      const habitIndex = habits.findIndex(h => h.id === habitId);

      if (habitIndex !== -1) {
        habits[habitIndex].completionStatus[date] = completed;
        await this.saveHabits(habits);
      }
    } catch (error) {
      console.error('Error updating habit completion:', error);
    }
  }

  async createHabit(habitData: Omit<Habit, 'id'>): Promise<Habit> {
    try {
      const habits = await this.getHabits();
      const newHabit: Habit = {
        ...habitData,
        id: uuidv4()
      };
      habits.push(newHabit);
      await this.saveHabits(habits);
      return newHabit;
    } catch (error) {
      console.error('Помилка при створенні звички:', error);
      throw error;
    }
  }

  async deleteHabit(habitId: string): Promise<void> {
    try {
      const habits = await this.getHabits();
      const updatedHabits = habits.filter(h => h.id !== habitId);
      await this.saveHabits(updatedHabits);
    } catch (error) {
      console.error('Помилка при видаленні звички:', error);
      throw error;
    }
  }

  private getInitialHabits(): Habit[] {
    return [
      {
        id: '1',
        name: {
          uk: 'Ранкова медитація',
          en: 'Morning Meditation',
          de: 'Morgenmeditation'
        },
        description: {
          uk: '10 хвилин медитації щодня',
          en: '10 minutes of meditation daily',
          de: '10 Minuten Meditation täglich'
        },
        icon: 'leaf-outline',
        category: 'mindfulness',
        difficulty: 'easy',
        points: 10,
        isActive: true,
        isChallengeHabit: false,
        isBaseHabit: true,
        completionStatus: {},
        streak: { current: 0, max: 0 },
        target: 10,
        unit: 'minutes',
        frequency: 'daily',
        progress: {}
      },
      {
        id: '2',
        name: {
          uk: 'Дихальні вправи',
          en: 'Breathing Exercises',
          de: 'Atemübungen'
        },
        description: {
          uk: '5 хвилин дихальних вправ',
          en: '5 minutes of breathing exercises',
          de: '5 Minuten Atemübungen'
        },
        icon: 'heart-outline',
        category: 'mindfulness',
        difficulty: 'easy',
        points: 5,
        isActive: true,
        isChallengeHabit: false,
        isBaseHabit: true,
        completionStatus: {},
        streak: { current: 0, max: 0 },
        target: 5,
        unit: 'minutes',
        frequency: 'daily',
        progress: {}
      },
      {
        id: '3',
        name: {
          uk: '8000 кроків',
          en: '8000 Steps',
          de: '8000 Schritte'
        },
        description: {
          uk: 'Пройдіть мінімум 8000 кроків',
          en: 'Walk at least 8000 steps',
          de: 'Mindestens 8000 Schritte gehen'
        },
        icon: 'footsteps-outline',
        category: 'fitness',
        difficulty: 'medium',
        points: 15,
        isActive: false,
        isChallengeHabit: false,
        isBaseHabit: true,
        completionStatus: {},
        streak: { current: 0, max: 0 },
        target: 8000,
        unit: 'steps',
        frequency: 'daily',
        progress: {}
      },
      {
        id: '4',
        name: {
          uk: 'Без солодкого',
          en: 'No Sweets',
          de: 'Keine Süßigkeiten'
        },
        description: {
          uk: 'Уникайте солодощів протягом дня',
          en: 'Avoid sweets throughout the day',
          de: 'Vermeiden Sie Süßigkeiten den ganzen Tag'
        },
        icon: 'ice-cream-outline',
        category: 'nutrition',
        difficulty: 'hard',
        points: 20,
        isActive: false,
        isChallengeHabit: false,
        isBaseHabit: true,
        completionStatus: {},
        streak: { current: 0, max: 0 },
        target: 1,
        unit: 'day',
        frequency: 'daily',
        progress: {}
      },
      {
        id: '5',
        name: {
          uk: '5 англійських слів',
          en: '5 English Words',
          de: '5 Englische Wörter'
        },
        description: {
          uk: 'Вивчіть нові слова',
          en: 'Learn new words',
          de: 'Neue Wörter lernen'
        },
        icon: 'book-outline',
        category: 'learning',
        difficulty: 'easy',
        points: 10,
        isActive: false,
        isChallengeHabit: false,
        isBaseHabit: true,
        completionStatus: {},
        streak: { current: 0, max: 0 },
        target: 5,
        unit: 'words',
        frequency: 'daily',
        progress: {}
      }
    ];
  }
}
