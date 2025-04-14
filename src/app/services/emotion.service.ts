import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Emotion } from '../models/emotion.model';
import { StorageService } from './storage.service';
import { v4 as uuidv4 } from 'uuid';

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
      await this.loadEmotions();
    } catch (error) {
      console.error('Error initializing emotions:', error);
    }
  }

  private async loadEmotions() {
    try {
      const emotions = await this.storageService.get(this.STORAGE_KEY) || [];
      this.emotionsSubject.next(emotions);
    } catch (error) {
      console.error('Error loading emotions:', error);
      this.emotionsSubject.next([]);
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
      return await this.storageService.get(this.STORAGE_KEY) || [];
    } catch (error) {
      console.error('Error getting emotions:', error);
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
    const emotions = await this.getAllEmotions();
    const filteredEmotions = emotions.filter(e => e.id !== id);
    await this.storageService.set(this.STORAGE_KEY, filteredEmotions);
    this.emotionsSubject.next(filteredEmotions);
  }

  async saveEmotion(emotionData: Omit<Emotion, 'id' | 'createdAt'>): Promise<void> {
    try {
      const emotions = await this.getAllEmotions();
      const newEmotion: Emotion = {
        ...emotionData,
        id: uuidv4(),
        createdAt: new Date().toISOString()
      };
      emotions.push(newEmotion);
      await this.storageService.set(this.STORAGE_KEY, emotions);
      this.emotionsSubject.next(emotions);
    } catch (error) {
      console.error('Error saving emotion:', error);
      throw error;
    }
  }

  async getEmotionsByDate(date: Date): Promise<Emotion[]> {
    const emotions = await this.getAllEmotions();
    return emotions.filter(emotion => {
      const emotionDate = new Date(emotion.date);
      return emotionDate.toDateString() === date.toDateString();
    });
  }

  async getEmotionalStates(startDate: Date, endDate: Date): Promise<Emotion[]> {
    try {
      const emotions = await this.getAllEmotions();
      return emotions.filter(emotion => {
        const emotionDate = new Date(emotion.date);
        return emotionDate >= startDate && emotionDate <= endDate;
      });
    } catch (error) {
      console.error('Error getting emotional states:', error);
      return [];
    }
  }
}
