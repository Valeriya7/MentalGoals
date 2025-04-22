import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { format } from 'date-fns';

@Injectable({
  providedIn: 'root'
})
export class HabitTrackerService {
  private readonly STORAGE_KEY = 'habitCompletions';

  constructor() {}

  async markHabitAsCompleted(habitId: string): Promise<void> {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const completions = await this.getCompletions();
      
      if (!completions[today]) {
        completions[today] = [];
      }
      
      if (!completions[today].includes(habitId)) {
        completions[today].push(habitId);
        await Preferences.set({
          key: this.STORAGE_KEY,
          value: JSON.stringify(completions)
        });
      }
    } catch (error) {
      console.error('Error marking habit as completed:', error);
    }
  }

  async isHabitCompletedToday(habitId: string): Promise<boolean> {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const completions = await this.getCompletions();
      
      return completions[today]?.includes(habitId) || false;
    } catch (error) {
      console.error('Error checking habit completion:', error);
      return false;
    }
  }

  private async getCompletions(): Promise<Record<string, string[]>> {
    try {
      const { value } = await Preferences.get({ key: this.STORAGE_KEY });
      return value ? JSON.parse(value) : {};
    } catch (error) {
      console.error('Error getting completions:', error);
      return {};
    }
  }

  async clearOldCompletions(): Promise<void> {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const completions = await this.getCompletions();
      
      // Видаляємо записи старші за сьогоднішній день
      const filteredCompletions = Object.fromEntries(
        Object.entries(completions).filter(([date]) => date >= today)
      );
      
      await Preferences.set({
        key: this.STORAGE_KEY,
        value: JSON.stringify(filteredCompletions)
      });
    } catch (error) {
      console.error('Error clearing old completions:', error);
    }
  }
} 