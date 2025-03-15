import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { Challenge, ChallengePhase, ChallengeTask } from '../interfaces/challenge.interface';
import { Storage } from '@ionic/storage-angular';
import { ModalService } from './modal.service';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {
  private activeChallenge = new BehaviorSubject<Challenge | null>(null);
  private storageReady = new BehaviorSubject<boolean>(false);
  private isLoading = new BehaviorSubject<boolean>(false);
  private readonly STORAGE_KEY = 'challenges';

  constructor(
    private toastController: ToastController,
    private modalService: ModalService,
    private storage: Storage
  ) {
    this.initStorage();
  }

  private async initStorage() {
    try {
      console.log('Checking storage initialization...');
      if (!this.storage) {
        throw new Error('Storage is not injected');
      }
      this.storageReady.next(true);
      console.log('Storage is ready');
    } catch (error) {
      console.error('Storage initialization error:', error);
      this.storageReady.next(false);
    }
  }

  private async ensureStorageReady(): Promise<Storage> {
    if (!this.storageReady.value) {
      console.log('Storage not ready, initializing...');
      await this.initStorage();
    }
    
    if (!this.storage || !this.storageReady.value) {
      console.error('Storage initialization failed');
      throw new Error('Storage not initialized');
    }
    
    return this.storage;
  }

  private async showSuccessToast(type: string): Promise<void> {
    const toast = await this.toastController.create({
      message: `Челендж "${type}" створено! Тепер ви можете його активувати.`,
      duration: 2000,
      position: 'bottom',
      color: 'success',
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }

  async startNewChallenge(type: string): Promise<boolean> {
    if (this.isLoading.value) {
      return false;
    }

    this.isLoading.next(true);

    try {
      await this.modalService.showLoading('Створення челенджу...');

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 40);

      const tasks: ChallengeTask[] = [
        {
          id: 'no-sweets',
          title: 'Без солодкого',
          description: 'Уникайте солодощів протягом дня',
          icon: 'ice-cream-outline',
          completed: false
        },
        {
          id: 'no-coffee',
          title: 'Без кави',
          description: 'Замініть каву на здорові альтернативи',
          icon: 'cafe-outline',
          completed: false
        },
        {
          id: 'exercise',
          title: '10 хвилин вправ',
          description: 'Виконайте комплекс вправ',
          icon: 'fitness-outline',
          completed: false
        },
        {
          id: 'steps',
          title: '8000 кроків',
          description: 'Пройдіть мінімум 8000 кроків',
          icon: 'footsteps-outline',
          completed: false
        },
        {
          id: 'english',
          title: '5 англійських слів',
          description: 'Вивчіть нові слова',
          icon: 'book-outline',
          completed: false
        }
      ];

      // Create a new challenge object
      const challenge: Challenge = {
        id: `challenge-${Date.now()}`,
        title: '40 Днів Здорових Звичок',
        description: 'Покращіть своє здоров\'я за 40 днів, формуючи корисні звички',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        duration: 40,
        tasks: tasks,
        status: 'active',
        rewards: {
          points: 40,
          discounts: [
            {
              brand: 'Adidas',
              amount: '15%'
            },
            {
              brand: 'Garmin',
              amount: '15%'
            },
            {
              brand: 'Nike',
              amount: '15%'
            }
          ]
        }
      };

      // Save the challenge to storage
      const storage = await this.ensureStorageReady();
      const challenges = await storage.get('challenges') || [];
      challenges.push(challenge);
      await storage.set('challenges', challenges);

      await this.modalService.hideLoading();
      await this.showSuccessToast(challenge.title);
      
      this.isLoading.next(false);
      return true;

    } catch (error) {
      console.error('Помилка при створенні челенджу:', error);
      await this.modalService.hideLoading();
      await this.showErrorToast();
      this.isLoading.next(false);
      return false;
    }
  }

  private async showErrorToast(): Promise<void> {
    const toast = await this.toastController.create({
      message: 'Не вдалося розпочати виклик. Спробуйте ще раз.',
      duration: 3000,
      position: 'bottom',
      color: 'danger',
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }

  getActiveChallenge(): Observable<Challenge | null> {
    return this.activeChallenge.asObservable();
  }

  async getChallenge(id: string): Promise<Challenge | undefined> {
    try {
      const storage = await this.ensureStorageReady();
      const challenges = await storage.get('challenges') || [];
      return challenges.find((c: Challenge) => c.id === id);
    } catch (error) {
      console.error('Error getting challenge:', error);
      return undefined;
    }
  }

  async getCurrentPhase(challengeId: string): Promise<ChallengePhase | null> {
    const challenge = await this.getChallenge(challengeId);
    if (!challenge || !challenge.tasks || challenge.tasks.length === 0) {
      return null;
    }
    
    return {
      id: challenge.id,
      title: challenge.title,
      tasks: challenge.tasks,
      startDate: challenge.startDate || new Date().toISOString(),
      endDate: challenge.endDate || new Date().toISOString()
    };
  }

  private async getProgress(challengeId: string, date: string): Promise<{ [key: string]: boolean }> {
    try {
      const storage = await this.ensureStorageReady();
      const key = `progress_${challengeId}_${date}`;
      const value = await storage.get(key);
      return value || {};
    } catch (error) {
      console.error('Error getting progress:', error);
      return {};
    }
  }

  async getTodayProgress(challengeId: string, date?: string): Promise<{ [key: string]: boolean }> {
    const challenge = await this.getChallenge(challengeId);
    if (!challenge) return {};

    const tasks = challenge.tasks || [];
    const dateStr = date || new Date().toISOString().split('T')[0];
    const progress = await this.getProgress(challengeId, dateStr);
    
    return tasks.reduce((acc, task) => {
      acc[task.id] = progress[task.id] || false;
      return acc;
    }, {} as { [key: string]: boolean });
  }

  async updateTodayProgress(challengeId: string, taskId: string, completed: boolean) {
    try {
      const storage = await this.ensureStorageReady();
      const today = new Date().toISOString().split('T')[0];
      const key = `progress_${challengeId}_${today}`;
      const progress = await this.getTodayProgress(challengeId, today);
      progress[taskId] = completed;
      await storage.set(key, progress);
    } catch (error) {
      console.error('Error updating today progress:', error);
      throw error;
    }
  }

  async quitChallenge(challengeId: string): Promise<boolean> {
    try {
      const storage = await this.ensureStorageReady();
      const challenges = await storage.get('challenges') || [];
      const challengeIndex = challenges.findIndex((c: Challenge) => c.id === challengeId);
      
      if (challengeIndex === -1) {
        throw new Error('Challenge not found');
      }

      challenges[challengeIndex].status = 'failed';
      await storage.set('challenges', challenges);
      
      if (this.activeChallenge.value?.id === challengeId) {
        this.activeChallenge.next(null);
      }

      const toast = await this.toastController.create({
        message: 'Ви відмовились від челенджу. Не засмучуйтесь, спробуйте знову коли будете готові!',
        duration: 3000,
        position: 'bottom',
        color: 'warning',
        buttons: [{ text: 'OK', role: 'cancel' }]
      });
      await toast.present();

      return true;
    } catch (error) {
      console.error('Error quitting challenge:', error);
      return false;
    }
  }

  async getStatistics(challengeId: string): Promise<{
    completedDays: number;
    totalDays: number;
    completedTasks: number;
    totalTasks: number;
    progress: number;
  }> {
    try {
      const challenge = await this.getChallenge(challengeId);
      if (!challenge) {
        throw new Error('Challenge not found');
      }

      const startDate = challenge.startDate ? new Date(challenge.startDate) : new Date();
      const currentDate = new Date();
      const daysDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const completedDays = Math.min(daysDiff + 1, 40);
      const totalDays = 40;

      const tasks = challenge.tasks || [];
      const totalTasks = tasks.length * totalDays;

      let completedTasks = 0;
      for (let i = 0; i < completedDays; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const dayProgress = await this.getTodayProgress(challengeId, dateStr);
        completedTasks += Object.values(dayProgress).filter(Boolean).length;
      }

      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        completedDays,
        totalDays,
        completedTasks,
        totalTasks,
        progress
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      return {
        completedDays: 0,
        totalDays: 40,
        completedTasks: 0,
        totalTasks: 0,
        progress: 0
      };
    }
  }

  private async cleanupStorage(): Promise<void> {
    try {
      const storage = await this.ensureStorageReady();
      const challenges = await storage.get('challenges') || [];
      
      // Створюємо Map для зберігання унікальних челенджів
      const uniqueChallenges = new Map<string, Challenge>();
      
      // Проходимо по всіх челенджах у зворотньому порядку
      for (let i = challenges.length - 1; i >= 0; i--) {
        const challenge = challenges[i];
        const type = challenge.id.includes('challenge-') ? 'default' : challenge.id;
        
        if (!uniqueChallenges.has(type)) {
          uniqueChallenges.set(type, challenge);
        }
      }
      
      // Зберігаємо тільки унікальні челенджі
      await storage.set('challenges', Array.from(uniqueChallenges.values()));
    } catch (error) {
      console.error('Error cleaning up storage:', error);
    }
  }

  async getChallenges(): Promise<Challenge[]> {
    try {
      await this.cleanupStorage(); // Очищаємо сховище перед отриманням челенджів
      const storage = await this.ensureStorageReady();
      const challenges = await storage.get('challenges') || [];
      
      return challenges.map((challenge: Challenge) => ({
        ...challenge,
        rewards: challenge.rewards || {
          points: 0,
          discounts: []
        }
      }));
    } catch (error) {
      console.error('Error getting challenges:', error);
      return [];
    }
  }

  async addChallenge(challenge: Challenge): Promise<void> {
    try {
      const storage = await this.ensureStorageReady();
      const challenges = await storage.get('challenges') || [];
      challenges.push(challenge);
      await storage.set('challenges', challenges);
    } catch (error) {
      console.error('Error adding challenge:', error);
      throw error;
    }
  }

  async updateChallenge(challenge: Challenge): Promise<void> {
    try {
      const storage = await this.ensureStorageReady();
      const challenges = await storage.get('challenges') || [];
      const index = challenges.findIndex((c: Challenge) => c.id === challenge.id);
      if (index !== -1) {
        challenges[index] = challenge;
        await storage.set('challenges', challenges);
      }
    } catch (error) {
      console.error('Error updating challenge:', error);
      throw error;
    }
  }

  async deleteChallenge(id: string): Promise<void> {
    try {
      const storage = await this.ensureStorageReady();
      const challenges = await storage.get('challenges') || [];
      const filtered = challenges.filter((c: Challenge) => c.id !== id);
      await storage.set('challenges', filtered);
    } catch (error) {
      console.error('Error deleting challenge:', error);
      throw error;
    }
  }

  async activateChallenge(challengeId: string): Promise<boolean> {
    try {
      const storage = await this.ensureStorageReady();
      const challenges = await storage.get('challenges') || [];
      
      // Перевіряємо, чи немає вже активного челенджу
      const hasActiveChallenge = challenges.some((c: Challenge) => c.status === 'active');
      if (hasActiveChallenge) {
        const toast = await this.toastController.create({
          message: 'У вас вже є активний челендж. Спочатку завершіть або відмовтесь від поточного.',
          duration: 3000,
          position: 'bottom',
          color: 'warning'
        });
        await toast.present();
        return false;
      }

      const challengeIndex = challenges.findIndex((c: Challenge) => c.id === challengeId);
      if (challengeIndex === -1) {
        throw new Error('Challenge not found');
      }

      // Оновлюємо дати при активації
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + challenges[challengeIndex].duration);

      challenges[challengeIndex] = {
        ...challenges[challengeIndex],
        status: 'active',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      await storage.set('challenges', challenges);
      
      // Update active challenge
      this.activeChallenge.next(challenges[challengeIndex]);

      const toast = await this.toastController.create({
        message: `Челендж "${challenges[challengeIndex].title}" активовано!`,
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();

      return true;
    } catch (error) {
      console.error('Error activating challenge:', error);
      return false;
    }
  }

  async deactivateAllChallenges(): Promise<boolean> {
    try {
      const storage = await this.ensureStorageReady();
      let challenges = await storage.get('challenges') || [];
      
      // Змінюємо статус всіх челенджів на 'completed'
      challenges = challenges.map((challenge: Challenge) => ({
        ...challenge,
        status: 'completed'
      }));

      await storage.set('challenges', challenges);
      
      // Очищаємо активний челендж
      this.activeChallenge.next(null);

      const toast = await this.toastController.create({
        message: 'Всі челенджі деактивовано',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();

      return true;
    } catch (error) {
      console.error('Error deactivating challenges:', error);
      return false;
    }
  }
} 