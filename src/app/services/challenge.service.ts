import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { Challenge } from '../interfaces/challenge.interface';
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

  async startNewChallenge(type: string): Promise<boolean> {
    if (this.isLoading.value) {
      console.log('Challenge creation already in progress');
      return false;
    }

    this.isLoading.next(true);

    try {
      await this.ensureStorageReady();
      
      await this.modalService.showLoading('Починаємо виклик...');

      // Імітуємо завантаження
      await new Promise(resolve => setTimeout(resolve, 1500));

      const tasks = [
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

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 40); // 40 днів для челенджу

      const phase = {
        id: 'phase-1',
        title: 'Фаза 1',
        tasks: tasks,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      // Create a new challenge object
      const challenge: Challenge = {
        id: `challenge-${Date.now()}`, // Унікальний ідентифікатор
        title: '40 Днів Здорових Звичок',
        description: 'Челендж для формування здорових звичок протягом 40 днів',
        phases: [phase],
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: 'active',
        progress: {
          currentDay: 1,
          totalDays: 40,
          completedTasks: 0,
          totalTasks: tasks.length * 40
        }
      };

      // Save the challenge to storage
      const storage = await this.ensureStorageReady();
      const challenges = await storage.get('challenges') || [];
      
      // Перевіряємо, чи немає вже активного челенджу
      const hasActiveChallenge = challenges.some((c: Challenge) => c.status === 'active');
      if (hasActiveChallenge) {
        await this.modalService.hideLoading();
        const toast = await this.toastController.create({
          message: 'У вас вже є активний челендж. Спочатку завершіть або відмовтесь від поточного.',
          duration: 3000,
          position: 'bottom',
          color: 'warning'
        });
        await toast.present();
        this.isLoading.next(false);
        return false;
      }

      challenges.push(challenge);
      await storage.set('challenges', challenges);

      // Update active challenge
      this.activeChallenge.next(challenge);

      await this.modalService.hideLoading();
      await this.showSuccessToast(challenge.title);
      
      this.isLoading.next(false);
      return true;

    } catch (error) {
      console.error('Помилка при старті виклику:', error);
      await this.modalService.hideLoading();
      await this.showErrorToast();
      this.isLoading.next(false);
      return false;
    }
  }

  private async showSuccessToast(type: string): Promise<void> {
    const toast = await this.toastController.create({
      message: `Виклик "${type}" успішно розпочато!`,
      duration: 2000,
      position: 'bottom',
      color: 'success',
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
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

  async getCurrentPhase(challengeId: string) {
    try {
      const challenge = await this.getChallenge(challengeId);
      if (!challenge || !challenge.phases || challenge.phases.length === 0) {
        console.warn('No phases found for challenge:', challengeId);
        return undefined;
      }
      return challenge.phases[0];
    } catch (error) {
      console.error('Error getting current phase:', error);
      return undefined;
    }
  }

  async getTodayProgress(challengeId: string, date?: string): Promise<{ [key: string]: boolean }> {
    try {
      const storage = await this.ensureStorageReady();
      const dateStr = date || new Date().toISOString().split('T')[0];
      const key = `progress_${challengeId}_${dateStr}`;
      return await storage.get(key) || {};
    } catch (error) {
      console.error('Error getting progress:', error);
      return {};
    }
  }

  async updateTodayProgress(challengeId: string, taskId: string, completed: boolean) {
    try {
      const storage = await this.ensureStorageReady();
      const today = new Date().toISOString().split('T')[0];
      const key = `progress_${challengeId}_${today}`;
      const progress = await this.getTodayProgress(challengeId);
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

      const startDate = new Date(challenge.startDate);
      const currentDate = new Date();
      const daysDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const completedDays = Math.min(daysDiff + 1, 40);
      const totalDays = 40;

      // Перевіряємо наявність фаз та завдань
      const tasks = challenge.phases?.[0]?.tasks || [];
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

  async getChallenges(): Promise<Challenge[]> {
    const { value } = await Preferences.get({ key: this.STORAGE_KEY });
    return value ? JSON.parse(value) : [];
  }

  async addChallenge(challenge: Challenge): Promise<void> {
    const challenges = await this.getChallenges();
    challenges.push(challenge);
    await Preferences.set({ key: this.STORAGE_KEY, value: JSON.stringify(challenges) });
  }

  async updateChallenge(challenge: Challenge): Promise<void> {
    const challenges = await this.getChallenges();
    const index = challenges.findIndex(c => c.id === challenge.id);
    if (index !== -1) {
      challenges[index] = challenge;
      await Preferences.set({ key: this.STORAGE_KEY, value: JSON.stringify(challenges) });
    }
  }

  async deleteChallenge(id: string): Promise<void> {
    const challenges = await this.getChallenges();
    const filtered = challenges.filter(c => c.id !== id);
    await Preferences.set({ key: this.STORAGE_KEY, value: JSON.stringify(filtered) });
  }
} 