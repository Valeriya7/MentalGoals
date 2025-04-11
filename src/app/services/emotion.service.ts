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

  async addEmotion(emotion: Emotion) {
    try {
      const emotions = await this.storageService.get('emotions') || [];
      emotions.push(emotion);
      await this.storageService.set('emotions', emotions);
      this.emotionsSubject.next(emotions);
    } catch (error) {
      console.error('Error adding emotion:', error);
    }
  }

  async getEmotions(): Promise<Emotion[]> {
    if (!this.storage) {
      await this.init();
    }
    return (await this.storage?.get(this.STORAGE_KEY)) || [];
  }

  async getEmotionsByDate(date: string): Promise<Emotion[]> {
    const emotions = await this.getEmotions();
    return emotions.filter(emotion => emotion.date === date);
  }

  async saveEmotion(emotion: Omit<Emotion, 'id' | 'createdAt'>): Promise<Emotion> {
    const emotions = await this.getEmotions();
    const newEmotion: Emotion = {
      ...emotion,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    
    emotions.push(newEmotion);
    await this.storage?.set(this.STORAGE_KEY, emotions);
    return newEmotion;
  }

  async deleteEmotion(id: string): Promise<void> {
    if (!this.storage) {
      await this.init();
    }
    const emotions = await this.getEmotions();
    const updatedEmotions = emotions.filter(emotion => emotion.id !== id);
    await this.storage?.set(this.STORAGE_KEY, updatedEmotions);
  }
} 