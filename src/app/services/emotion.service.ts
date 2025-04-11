import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Emotion } from '../models/emotion.model';
import { StorageService } from './storage.service';
import { Storage } from '@ionic/storage-angular';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class EmotionService {
  private emotionsSubject = new BehaviorSubject<Emotion[]>([]);
  public emotions$ = this.emotionsSubject.asObservable();
  private storage: Storage | null = null;
  private readonly STORAGE_KEY = 'emotions';

  constructor(private storageService: StorageService, private storageServiceIonic: Storage) {
    this.loadEmotions();
    this.init();
  }

  private async init() {
    this.storage = await this.storageServiceIonic.create();
  }

  private async loadEmotions() {
    try {
      const emotions = await this.storageService.get('emotions') || [];
      this.emotionsSubject.next(emotions);
    } catch (error) {
      console.error('Error loading emotions:', error);
      this.emotionsSubject.next([]);
    }
  }

  async addEmotion(emotion: Omit<Emotion, 'id' | 'createdAt'>): Promise<void> {
    const emotions = await this.getAllEmotions();
    const newEmotion: Emotion = {
      ...emotion,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    emotions.push(newEmotion);
    await this.storageService.set(this.STORAGE_KEY, emotions);
  }

  async getAllEmotions(): Promise<Emotion[]> {
    const emotions = await this.storageService.get(this.STORAGE_KEY);
    return emotions || [];
  }

  async getEmotionsForPeriod(startDate: Date, endDate: Date): Promise<Emotion[]> {
    const emotions = await this.getAllEmotions();
    return emotions.filter(emotion => {
      const emotionDate = new Date(emotion.date);
      return emotionDate >= startDate && emotionDate <= endDate;
    });
  }

  async getEmotionForDate(date: Date): Promise<Emotion | null> {
    const emotions = await this.getAllEmotions();
    const targetDate = date.toISOString().split('T')[0];
    return emotions.find(emotion => emotion.date.split('T')[0] === targetDate) || null;
  }

  async updateEmotion(id: string, emotion: Partial<Emotion>): Promise<void> {
    const emotions = await this.getAllEmotions();
    const index = emotions.findIndex(e => e.id === id);
    if (index !== -1) {
      emotions[index] = { ...emotions[index], ...emotion };
      await this.storageService.set(this.STORAGE_KEY, emotions);
    }
  }

  async deleteEmotion(id: string): Promise<void> {
    const emotions = await this.getAllEmotions();
    const filteredEmotions = emotions.filter(e => e.id !== id);
    await this.storageService.set(this.STORAGE_KEY, filteredEmotions);
  }
} 