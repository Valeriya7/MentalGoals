import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { v4 as uuidv4 } from 'uuid';

export interface Habit {
  id: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  reminderTime?: string;
  progress?: { [date: string]: boolean };
  createdAt: Date;
  isActive: boolean;
  streak: {
    current: number;
    max: number;
  };
  target: number;
}

@Injectable({
  providedIn: 'root'
})
export class HabitService {
  constructor(private storage: Storage) {}

  async getHabits(): Promise<Habit[]> {
    return (await this.storage.get('habits')) || [];
  }

  async createHabit(habitData: Omit<Habit, 'id'>): Promise<Habit> {
    try {
      const habits = await this.getHabits();
      const newHabit: Habit = {
        ...habitData,
        id: uuidv4()
      };
      habits.push(newHabit);
      await this.storage.set('habits', habits);
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
      await this.storage.set('habits', updatedHabits);
    } catch (error) {
      console.error('Помилка при видаленні звички:', error);
      throw error;
    }
  }

  async updateHabitProgress(habitId: string, completed: boolean, date: Date = new Date()): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const habitDate = new Date(date);
      habitDate.setHours(0, 0, 0, 0);
      
      if (habitDate.getTime() !== today.getTime()) {
        throw new Error('INVALID_DATE');
      }

      const habits = await this.getHabits();
      const habitIndex = habits.findIndex((h: Habit) => h.id === habitId);
      
      if (habitIndex === -1) {
        throw new Error('HABIT_NOT_FOUND');
      }
      
      const habit = habits[habitIndex];
      const todayStr = date.toISOString().split('T')[0];
      
      if (!habit.progress) {
        habit.progress = {};
      }
      
      habit.progress[todayStr] = completed;
      
      // Оновлюємо streak
      if (completed) {
        habit.streak.current += 1;
        if (habit.streak.current > habit.streak.max) {
          habit.streak.max = habit.streak.current;
        }
      } else {
        habit.streak.current = 0;
      }
      
      // Перевіряємо чи досягнуто ціль
      if (habit.streak.current >= habit.target) {
        habit.isActive = false;
        throw new Error('HABIT_COMPLETED');
      }
      
      habits[habitIndex] = habit;
      await this.storage.set('habits', habits);
    } catch (error) {
      console.error('Помилка при оновленні прогресу звички:', error);
      throw error;
    }
  }

  // ... existing code ...
} 