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
    try {
      const today = new Date();
      const testData: UserProgress[] = [];

      // Створюємо дані за останні 2 тижні
      for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        // Базові значення для кожного дня
        let steps = 8000;
        let sleepHours = 7.5;
        let waterAmount = 2.0;

        // Додаємо варіативність для більш реалістичних даних
        steps += Math.floor(Math.random() * 4000) - 2000; // Від 6000 до 12000 кроків
        sleepHours += (Math.random() * 2) - 1; // Від 6.5 до 8.5 годин
        waterAmount += (Math.random() * 1) - 0.5; // Від 1.5 до 2.5 літрів

        // Забезпечуємо мінімальні значення
        steps = Math.max(3000, steps);
        sleepHours = Math.max(4, Math.min(10, sleepHours));
        waterAmount = Math.max(0.5, Math.min(4, waterAmount));

        testData.push({
          date: date.toISOString(),
          steps: Math.round(steps),
          sleepHours: Number(sleepHours.toFixed(1)),
          waterAmount: Number(waterAmount.toFixed(1))
        });
      }

      // Зберігаємо дані
      await this.saveTestData(testData);
      console.log('Test data initialized successfully');
    } catch (error) {
      console.error('Error initializing test data:', error);
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

  async getStepsHistory(startDate: Date, endDate: Date): Promise<{ date: string; steps: number }[]> {
    try {
      const allProgress = await this.getAllUserProgress();
      return allProgress
        .filter(progress => {
          const progressDate = new Date(progress.date);
          return progressDate >= startDate && progressDate <= endDate;
        })
        .map(progress => ({
          date: new Date(progress.date).toISOString().split('T')[0],
          steps: progress.steps
        }));
    } catch (error) {
      console.error('Error getting steps history:', error);
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
