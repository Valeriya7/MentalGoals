import { Injectable } from '@angular/core';
import { Emotion } from '../models/emotion.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class EmotionalService {
  private readonly STORAGE_KEY = 'emotional_states';

  constructor(private authService: AuthService) {}

  async saveEmotion(emotion: Emotion): Promise<void> {
    const emotions = await this.getEmotions();
    emotions.push(emotion);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(emotions));
  }

  async getEmotions(): Promise<Emotion[]> {
    const emotions = localStorage.getItem(this.STORAGE_KEY);
    return emotions ? JSON.parse(emotions) : [];
  }

  async getEmotionsByDate(date: Date): Promise<Emotion[]> {
    const emotions = await this.getEmotions();
    return emotions.filter(emotion => {
      const emotionDate = new Date(emotion.date);
      return emotionDate.toDateString() === date.toDateString();
    });
  }

  async deleteEmotion(id: string): Promise<void> {
    const emotions = await this.getEmotions();
    const updatedEmotions = emotions.filter(emotion => emotion.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedEmotions));
  }

  async getEmotionalStates(startDate: Date, endDate: Date): Promise<Emotion[]> {
    try {
      const emotions = await this.getEmotions();
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
