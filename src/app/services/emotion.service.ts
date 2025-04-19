import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Emotion } from '../models/emotion.model';
import { StorageService } from './storage.service';
import { v4 as uuidv4 } from 'uuid';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class EmotionService {
  private emotionsSubject = new BehaviorSubject<Emotion[]>([]);
  public emotions$ = this.emotionsSubject.asObservable();
  private readonly STORAGE_KEY = 'emotions';

  constructor(private storageService: StorageService) {
    this.init();
  }

  private async init() {
    try {
      console.log('Ініціалізація EmotionService');
      const emotions = await this.getAllEmotions();
      console.log('Завантажені емоції при ініціалізації:', emotions);
      if (emotions) {
        this.emotionsSubject.next(emotions);
      }
    } catch (error) {
      console.error('Помилка при ініціалізації емоцій:', error);
    }
  }

  public async loadEmotions() {
    try {
      console.log('Завантаження емоцій');
      const emotions = await this.getAllEmotions();
      console.log('Завантажені емоції:', emotions);
      if (emotions) {
        this.emotionsSubject.next(emotions);
      }
    } catch (error) {
      console.error('Помилка при завантаженні емоцій:', error);
    }
  }

  async addEmotion(emotion: Omit<Emotion, 'id' | 'createdAt'>): Promise<void> {
    try {
      const emotions = await this.getAllEmotions();
      
      // Перевіряємо, чи не існує вже емоція на цю дату
      const date = new Date(emotion.date).toISOString().split('T')[0];
      const existingEmotionIndex = emotions.findIndex(e => 
        new Date(e.date).toISOString().split('T')[0] === date
      );

      const newEmotion: Emotion = {
        ...emotion,
        id: uuidv4(),
        createdAt: new Date().toISOString()
      };

      if (existingEmotionIndex !== -1) {
        // Оновлюємо існуючу емоцію
        emotions[existingEmotionIndex] = newEmotion;
      } else {
        // Додаємо нову емоцію
        emotions.push(newEmotion);
      }

      await this.storageService.set(this.STORAGE_KEY, emotions);
      this.emotionsSubject.next(emotions);
    } catch (error) {
      console.error('Error adding emotion:', error);
      throw error;
    }
  }

  async getAllEmotions(): Promise<Emotion[]> {
    try {
      console.log('Отримання всіх емоцій');
      
      // Спочатку пробуємо отримати з StorageService
      let emotions = await this.storageService.get(this.STORAGE_KEY);
      console.log('Емоції з StorageService:', emotions);

      // Якщо немає даних, пробуємо отримати з Preferences
      if (!emotions || emotions.length === 0) {
        console.log('Спробуємо отримати емоції з Preferences');
        const { value } = await Preferences.get({ key: this.STORAGE_KEY });
        if (value) {
          emotions = JSON.parse(value);
          console.log('Емоції з Preferences:', emotions);
          
          // Зберігаємо в StorageService для подальшого використання
          await this.storageService.set(this.STORAGE_KEY, emotions);
        }
      }

      return emotions || [];
    } catch (error) {
      console.error('Помилка при отриманні емоцій:', error);
      return [];
    }
  }

  async getEmotionsForPeriod(startDate: Date, endDate: Date): Promise<Emotion[]> {
    try {
      const emotions = await this.getAllEmotions();
      console.log('Завантажені емоції:', emotions);
      
      const filteredEmotions = emotions.filter(emotion => {
        if (!emotion || !emotion.date) return false;
        
        const emotionDate = new Date(emotion.date);
        const isInRange = emotionDate >= startDate && emotionDate <= endDate;
        
        console.log(`Перевірка дати ${emotionDate.toISOString()}: ${isInRange}`);
        return isInRange;
      });
      
      console.log('Відфільтровані емоції за період:', filteredEmotions);
      return filteredEmotions;
    } catch (error) {
      console.error('Помилка при отриманні емоцій за період:', error);
      return [];
    }
  }

  async getEmotionForDate(date: Date): Promise<Emotion | null> {
    const emotions = await this.getAllEmotions();
    const targetDate = date.toISOString().split('T')[0];
    return emotions.find(emotion => emotion.date.split('T')[0] === targetDate) || null;
  }

  async updateEmotion(id: string, emotion: Partial<Emotion>): Promise<void> {
    const emotions = await this.getAllEmotions();
    console.log('emotions: ', emotions);
    const index = emotions.findIndex(e => e.id === id);
    if (index !== -1) {
      emotions[index] = { ...emotions[index], ...emotion };
      await this.storageService.set(this.STORAGE_KEY, emotions);
      this.emotionsSubject.next(emotions);
    }
  }

  async deleteEmotion(id: string): Promise<void> {
    try {
      const emotions = await this.getAllEmotions();
      const updatedEmotions = emotions.filter(emotion => emotion.id !== id);
      await this.storageService.set(this.STORAGE_KEY, updatedEmotions);
      this.emotionsSubject.next(updatedEmotions);
    } catch (error) {
      console.error('Error deleting emotion:', error);
      throw error;
    }
  }

  async saveEmotion(emotion: Omit<Emotion, 'id' | 'createdAt'>): Promise<void> {
    try {
      console.log('Збереження емоції:', emotion);
      const newEmotion: Emotion = {
        ...emotion,
        id: uuidv4(),
        createdAt: new Date().toISOString()
      };

      const currentEmotions = await this.getAllEmotions();
      console.log('Поточні емоції:', currentEmotions);
      
      const updatedEmotions = [...currentEmotions, newEmotion];
      console.log('Оновлені емоції:', updatedEmotions);
      
      // Зберігаємо в обидва сховища
      await this.storageService.set(this.STORAGE_KEY, updatedEmotions);
      await Preferences.set({
        key: this.STORAGE_KEY,
        value: JSON.stringify(updatedEmotions)
      });
      
      this.emotionsSubject.next(updatedEmotions);
      console.log('Емоція успішно збережена');
    } catch (error) {
      console.error('Помилка при збереженні емоції:', error);
      throw error;
    }
  }

  async getEmotionsByDate(date: Date): Promise<Emotion[]> {
    try {
      const emotions = await this.getAllEmotions();
      return emotions.filter(emotion => {
        const emotionDate = new Date(emotion.date);
        return emotionDate.toDateString() === date.toDateString();
      });
    } catch (error) {
      console.error('Error getting emotions by date:', error);
      return [];
    }
  }

  async getEmotionalStates(startDate: Date, endDate: Date): Promise<Emotion[]> {
    try {
      const emotions = await this.getAllEmotions();
      console.log('Завантажені емоції:', emotions);
      
      if (!emotions || !Array.isArray(emotions)) {
        console.warn('Немає даних про емоції або невірний формат');
        return [];
      }

      // Нормалізуємо дати (встановлюємо час на початок/кінець дня)
      const normalizedStartDate = new Date(startDate);
      normalizedStartDate.setHours(0, 0, 0, 0);
      
      const normalizedEndDate = new Date(endDate);
      normalizedEndDate.setHours(23, 59, 59, 999);

      console.log('Пошук емоцій в періоді від', normalizedStartDate, 'до', normalizedEndDate);

      const filteredEmotions = emotions.filter(emotion => {
        if (!emotion || !emotion.date) {
          console.log('Пропущено емоцію через відсутність дати:', emotion);
          return false;
        }

        const emotionDate = new Date(emotion.date);
        emotionDate.setHours(12, 0, 0, 0); // Встановлюємо час на середину дня для уникнення проблем з часовими поясами

        const isInRange = emotionDate >= normalizedStartDate && emotionDate <= normalizedEndDate;
        console.log(`Перевірка дати ${emotionDate.toISOString()}: ${isInRange}`);
        
        return isInRange;
      });

      console.log('Знайдені емоції за період:', filteredEmotions);
      return filteredEmotions;
    } catch (error) {
      console.error('Помилка при отриманні емоцій за період:', error);
      return [];
    }
  }

  async refreshCalendar() {
    try {
      // Оновлюємо дані в сервісі
      await this.loadEmotions();
      
      // Оновлюємо дані в BehaviorSubject
      const emotions = await this.getAllEmotions();
      this.emotionsSubject.next(emotions);
    } catch (error) {
      console.error('Error refreshing calendar:', error);
      throw error;
    }
  }
}
