import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

export interface UserProgress {
  id?: string;
  steps: number;
  sleepHours: number;
  waterAmount: number;
  date: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private readonly STORAGE_KEY = 'user_progress';

  constructor(private authService: AuthService) {
    this.initializeTestData();
  }

  private async initializeTestData() {
    const existingData = await this.getAllUserProgress();
    if (existingData.length === 0) {
      const today = new Date();
      const testData: UserProgress[] = [
        {
          steps: 8500,
          sleepHours: 7,
          waterAmount: 2,
          date: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString() // 6 днів тому
        },
        {
          steps: 6200,
          sleepHours: 8,
          waterAmount: 1.5,
          date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 днів тому
        },
        {
          steps: 4300,
          sleepHours: 6,
          waterAmount: 1.8,
          date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString() // 4 дні тому
        },
        {
          steps: 7800,
          sleepHours: 7.5,
          waterAmount: 2.2,
          date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 дні тому
        },
        {
          steps: 5600,
          sleepHours: 8,
          waterAmount: 1.7,
          date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 дні тому
        },
        {
          steps: 4100,
          sleepHours: 7,
          waterAmount: 1.9,
          date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() // вчора
        },
        {
          steps: 8500,
          sleepHours: 8,
          waterAmount: 2.1,
          date: today.toISOString() // сьогодні
        }
      ];

      await this.saveTestData(testData);
    }
  }

  private async saveTestData(data: UserProgress[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  async getAllUserProgress(): Promise<UserProgress[]> {
    try {
      const progressData = localStorage.getItem(this.STORAGE_KEY);
      if (!progressData) return [];

      /* !!! Це для реальних данних
      const progress = JSON.parse(progressData);
      return progress.map((item: any) => ({
        ...item,
        date: new Date(item.date)
      }));*/
      return JSON.parse(progressData);
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

  async getUserProgressInRange(startDate: Date, endDate: Date): Promise<UserProgress[]> {
    try {
      const allProgress = await this.getAllUserProgress();
      return allProgress.filter(progress => {
        const progressDate = new Date(progress.date);
        return progressDate >= startDate && progressDate <= endDate;
      });
    } catch (error) {
      console.error('Error getting user progress:', error);
      return [];
    }
  }
 /*
  async saveProgress(progress: UserProgress): Promise<void> {
    try {
      const existingData = await this.getAllUserProgress();

      // Перевіряємо чи є вже запис за цю дату
      const existingIndex = existingData.findIndex(item =>
        new Date(item.date).toDateString() === new Date(progress.date).toDateString()
      );

      if (existingIndex !== -1) {
        // Оновлюємо існуючий запис
        existingData[existingIndex] = progress;
      } else {
        // Додаємо новий запис
        existingData.push(progress);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingData));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }
  */
}
