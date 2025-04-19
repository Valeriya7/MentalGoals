import { Injectable } from '@angular/core';
import { Emotion } from '../models/emotion.model';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class EmotionalService {
  private readonly STORAGE_KEY = 'emotions';

  constructor(
    private authService: AuthService,
    private storageService: StorageService
  ) {}

  async saveEmotion(emotion: Emotion): Promise<void> {
    try {
      console.log('Збереження емоції:', emotion);
      const emotions = await this.getEmotions();
      emotions.push(emotion);
      
      // Зберігаємо в обидва сховища
      await this.storageService.set(this.STORAGE_KEY, emotions);
      await Preferences.set({
        key: this.STORAGE_KEY,
        value: JSON.stringify(emotions)
      });
      console.log('Емоція успішно збережена');
    } catch (error) {
      console.error('Помилка при збереженні емоції:', error);
      throw error;
    }
  }

  async getEmotions(): Promise<Emotion[]> {
    try {
      console.log('Отримання емоцій');
      
      // Спочатку пробуємо отримати з StorageService
      let emotions = await this.storageService.get(this.STORAGE_KEY);
      console.log('Емоції з StorageService:', emotions);

      // Якщо немає даних, пробуємо отримати з localStorage
      if (!emotions || emotions.length === 0) {
        console.log('Спробуємо отримати емоції з localStorage');
        const localStorageEmotions = localStorage.getItem(this.STORAGE_KEY);
        if (localStorageEmotions) {
          emotions = JSON.parse(localStorageEmotions);
          console.log('Емоції з localStorage:', emotions);
          
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

  async getEmotionsByDate(date: Date): Promise<Emotion[]> {
    try {
      console.log('Отримання емоцій за датою:', date);
      const emotions = await this.getEmotions();
      
      // Нормалізуємо дату для порівняння
      const targetDate = new Date(date);
      targetDate.setHours(12, 0, 0, 0);
      
      const filteredEmotions = emotions.filter(emotion => {
        if (!emotion || !emotion.date) return false;
        
        const emotionDate = new Date(emotion.date);
        emotionDate.setHours(12, 0, 0, 0);
        
        const isSameDate = emotionDate.toDateString() === targetDate.toDateString();
        console.log(`Перевірка дати ${emotionDate.toISOString()}: ${isSameDate}`);
        return isSameDate;
      });
      
      console.log('Знайдені емоції за датою:', filteredEmotions);
      return filteredEmotions;
    } catch (error) {
      console.error('Помилка при отриманні емоцій за датою:', error);
      return [];
    }
  }

  async deleteEmotion(id: string): Promise<void> {
    try {
      console.log('Видалення емоції з id:', id);
      const emotions = await this.getEmotions();
      const updatedEmotions = emotions.filter(emotion => emotion.id !== id);
      
      // Оновлюємо обидва сховища
      await this.storageService.set(this.STORAGE_KEY, updatedEmotions);
      await Preferences.set({
        key: this.STORAGE_KEY,
        value: JSON.stringify(updatedEmotions)
      });
      console.log('Емоція успішно видалена');
    } catch (error) {
      console.error('Помилка при видаленні емоції:', error);
      throw error;
    }
  }

  async getEmotionalStates(startDate: Date, endDate: Date): Promise<Emotion[]> {
    try {
      console.log('Отримання емоцій за період від', startDate, 'до', endDate);
      const emotions = await this.getEmotions();
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
}
