import { Injectable } from '@angular/core';

export interface UserProgress {
  steps: number;
  sleepHours: number;
  waterAmount: number;
  date: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private readonly STORAGE_KEY = 'user_progress';

  constructor() {}

  async getAllUserProgress(): Promise<UserProgress[]> {
    try {
      const progressData = localStorage.getItem(this.STORAGE_KEY);
      if (!progressData) return [];

      const progress = JSON.parse(progressData);
      return progress.map((item: any) => ({
        ...item,
        date: new Date(item.date)
      }));
    } catch (error) {
      console.error('Error getting progress data:', error);
      return [];
    }
  }

  async saveProgress(progress: UserProgress): Promise<void> {
    try {
      const existingData = await this.getAllUserProgress();
      existingData.push(progress);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingData));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }
} 