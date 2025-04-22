import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Habit } from '../interfaces/habit.interface';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class HabitsService {
  private habits = new BehaviorSubject<Habit[]>([]);
  private readonly STORAGE_KEY = 'habits';

  constructor() {
    this.loadHabits();
  }

  private async loadHabits() {
    try {
      const { value } = await Preferences.get({ key: this.STORAGE_KEY });
      console.log('loadHabits ', value);
      if (value) {
        this.habits.next(JSON.parse(value));
      } else {
        // Завантажуємо початковий список звичок
        const initialHabits = this.getInitialHabits();
        this.habits.next(initialHabits);
        await this.saveHabits(initialHabits);
      }
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  }

  private async saveHabits(habits: Habit[]) {
    console.log('saveHabits: ', habits);
    try {
      await Preferences.set({
        key: this.STORAGE_KEY,
        value: JSON.stringify(habits)
      });
    } catch (error) {
      console.error('Error saving habits:', error);
    }
  }

  getHabits(): Observable<Habit[]> {
    return this.habits.asObservable();
  }

  getActiveHabits(): Observable<Habit[]> {
    return new Observable(subscriber => {
      this.habits.subscribe(habits => {
        subscriber.next(habits.filter(habit => habit.isActive));
      });
    });
  }

  getAvailableHabits(): Observable<Habit[]> {
    return new Observable(subscriber => {
      this.habits.subscribe(habits => {
        subscriber.next(habits.filter(habit => !habit.isActive));
      });
    });
  }

  async toggleHabit(habitId: string, date: string, status: 'completed' | 'partial' | 'not_completed') {
    const habits = this.habits.value;
    const habitIndex = habits.findIndex(h => h.id === habitId);

    if (habitIndex !== -1) {
      const habit = habits[habitIndex];
      if (!habit.isActive) {
        throw new Error('Cannot toggle inactive habit');
      }
      habit.completionStatus[date] = status;
      this.habits.next(habits);
      await this.saveHabits(habits);
      this.updateStreak(habitId);
    }
  }

  async activateHabit(habitId: string) {
    const habits = this.habits.value;
    const habitIndex = habits.findIndex(h => h.id === habitId);

    if (habitIndex !== -1) {
      habits[habitIndex].isActive = true;
      this.habits.next(habits);
      await this.saveHabits(habits);
    }
  }

  async deactivateHabit(habitId: string) {
    const habits = this.habits.value;
    const habitIndex = habits.findIndex(h => h.id === habitId);

    if (habitIndex !== -1) {
      habits[habitIndex].isActive = false;
      this.habits.next(habits);
      await this.saveHabits(habits);
    }
  }

  private updateStreak(habitId: string) {
    const habits = this.habits.value;
    const habitIndex = habits.findIndex(h => h.id === habitId);

    if (habitIndex !== -1) {
      const habit = habits[habitIndex];
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // Перевіряємо частоту звички
      if (habit.frequency === 'daily') {
        if (habit.completionStatus[today] === 'completed') {
          if (habit.completionStatus[yesterday] === 'completed') {
            habit.streak.current++;
          } else {
            // Перевіряємо, чи не було пропущених днів
            const lastCompletedDate = this.getLastCompletedDate(habit);
            if (lastCompletedDate && this.getDaysBetween(lastCompletedDate, today) <= 1) {
              habit.streak.current++;
            } else {
              habit.streak.current = 1;
            }
          }
        } else if (habit.completionStatus[today] === 'not_completed') {
          habit.streak.current = 0;
        }
      } else if (habit.frequency === 'weekly') {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekStartStr = weekStart.toISOString().split('T')[0];
        
        if (habit.completionStatus[today] === 'completed') {
          const lastWeekStart = new Date(weekStart);
          lastWeekStart.setDate(lastWeekStart.getDate() - 7);
          const lastWeekStartStr = lastWeekStart.toISOString().split('T')[0];
          
          if (habit.completionStatus[lastWeekStartStr] === 'completed') {
            habit.streak.current++;
          } else {
            habit.streak.current = 1;
          }
        } else if (habit.completionStatus[today] === 'not_completed') {
          habit.streak.current = 0;
        }
      } else if (habit.frequency === 'monthly') {
        const monthStart = new Date(today);
        monthStart.setDate(1);
        const monthStartStr = monthStart.toISOString().split('T')[0];
        
        if (habit.completionStatus[today] === 'completed') {
          const lastMonthStart = new Date(monthStart);
          lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
          const lastMonthStartStr = lastMonthStart.toISOString().split('T')[0];
          
          if (habit.completionStatus[lastMonthStartStr] === 'completed') {
            habit.streak.current++;
          } else {
            habit.streak.current = 1;
          }
        } else if (habit.completionStatus[today] === 'not_completed') {
          habit.streak.current = 0;
        }
      }

      // Оновлюємо найкращий streak
      if (habit.streak.current > habit.streak.best) {
        habit.streak.best = habit.streak.current;
      }

      this.habits.next(habits);
      this.saveHabits(habits);
    }
  }

  private getLastCompletedDate(habit: Habit): string | null {
    const dates = Object.keys(habit.completionStatus)
      .filter(date => habit.completionStatus[date] === 'completed')
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    return dates.length > 0 ? dates[0] : null;
  }

  private getDaysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getInitialHabits(): Habit[] {
    return [
      {
        id: '1',
        name: 'Ранкова медитація',
        description: '10 хвилин медитації щодня',
        icon: 'leaf-outline',
        category: 'mindfulness',
        difficulty: 'easy',
        points: 10,
        isActive: true,
        isChallengeHabit: false,
        isBaseHabit: true,
        completionStatus: {},
        streak: { current: 0, best: 0 },
        target: 10,
        unit: 'minutes',
        frequency: 'daily',
        progress: {}
      },
      {
        id: '2',
        name: 'Дихальні вправи',
        description: '5 хвилин дихальних вправ',
        icon: 'heart-outline',
        category: 'mindfulness',
        difficulty: 'easy',
        points: 5,
        isActive: true,
        isChallengeHabit: false,
        isBaseHabit: true,
        completionStatus: {},
        streak: { current: 0, best: 0 },
        target: 5,
        unit: 'minutes',
        frequency: 'daily',
        progress: {}
      },
      {
        id: '3',
        name: '8000 кроків',
        description: 'Пройдіть мінімум 8000 кроків',
        icon: 'footsteps-outline',
        category: 'fitness',
        difficulty: 'medium',
        points: 15,
        isActive: false,
        isChallengeHabit: false,
        isBaseHabit: true,
        completionStatus: {},
        streak: { current: 0, best: 0 },
        target: 8000,
        unit: 'steps',
        frequency: 'daily',
        progress: {}
      },
      {
        id: '4',
        name: 'Без солодкого',
        description: 'Уникайте солодощів протягом дня',
        icon: 'ice-cream-outline',
        category: 'nutrition',
        difficulty: 'hard',
        points: 20,
        isActive: false,
        isChallengeHabit: false,
        isBaseHabit: true,
        completionStatus: {},
        streak: { current: 0, best: 0 },
        target: 1,
        unit: 'day',
        frequency: 'daily',
        progress: {}
      },
      {
        id: '5',
        name: '5 англійських слів',
        description: 'Вивчіть нові слова',
        icon: 'book-outline',
        category: 'learning',
        difficulty: 'easy',
        points: 10,
        isActive: false,
        isChallengeHabit: false,
        completionStatus: {},
        streak: { current: 0, best: 0 },
        target: 5,
        unit: 'words',
        frequency: 'daily',
        progress: {}
      }
    ];
  }

  async createHabit(habit: Habit): Promise<void> {
    const habits = this.habits.value;
    habits.push(habit);
    this.habits.next(habits);
    await this.saveHabits(habits);
  }

  async updateHabit(habit: Habit): Promise<void> {
    const habits = this.habits.value;
    const habitIndex = habits.findIndex(h => h.id === habit.id);

    if (habitIndex !== -1) {
      habits[habitIndex] = habit;
      this.habits.next(habits);
      await this.saveHabits(habits);
    }
  }

  async deleteHabit(habitId: string): Promise<void> {
    const habits = this.habits.value;
    const filteredHabits = habits.filter(h => h.id !== habitId);
    this.habits.next(filteredHabits);
    await this.saveHabits(filteredHabits);
  }
}
