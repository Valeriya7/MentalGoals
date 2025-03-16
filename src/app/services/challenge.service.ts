import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { Challenge, ChallengePhase, ChallengeTask } from '../interfaces/challenge.interface';
import { ModalService } from './modal.service';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@ionic/angular';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {
  private activeChallenge = new BehaviorSubject<Challenge | null>(null);
  private storageReady = new BehaviorSubject<boolean>(false);
  private isLoading = new BehaviorSubject<boolean>(false);
  private readonly STORAGE_KEY = 'challenges';
  private readonly ALLOWED_ORIGINS = ['localhost', 'mentalgoals.app'];
  private preferenceStorage = true;

  constructor(
    private toastController: ToastController,
    private modalService: ModalService,
    private storageService: StorageService,
    private platform: Platform
  ) {
    this.init();
  }

  private isOriginAllowed(): boolean {
    try {
      const currentOrigin = window.location.hostname;
      return this.ALLOWED_ORIGINS.some(origin => currentOrigin.includes(origin));
    } catch (error) {
      console.error('Error checking origin:', error);
      return false;
    }
  }

  private isSecureContext(): boolean {
    try {
      return window.isSecureContext && 
             window.location.protocol === 'https:' || 
             window.location.hostname === 'localhost';
    } catch {
      return false;
    }
  }

  private isIframeSafe(): boolean {
    try {
      // Перевіряємо, чи ми в iframe
      if (window.top !== window.self) {
        const frameElement = window.frameElement;
        
        // Перевіряємо атрибути sandbox
        if (frameElement && frameElement.hasAttribute('sandbox')) {
          const sandbox = frameElement.getAttribute('sandbox') || '';
          
          // Перевіряємо небезпечну комбінацію атрибутів
          if (sandbox.includes('allow-scripts') && sandbox.includes('allow-same-origin')) {
            console.error('Unsafe iframe configuration detected');
            return false;
          }
          
          // Перевіряємо необхідні безпечні атрибути
          const requiredAttributes = ['allow-forms', 'allow-scripts'];
          const hasAllRequired = requiredAttributes.every(attr => sandbox.includes(attr));
          
          if (!hasAllRequired) {
            console.error('Missing required sandbox attributes');
            return false;
          }
        }
        
        // Перевіряємо CSP заголовки
        const csp = document.head.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (!csp) {
          console.warn('No CSP meta tag found');
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking iframe safety:', error);
      return false;
    }
  }

  private async validateStorageAccess(): Promise<boolean> {
    // Перевіряємо безпечний контекст
    if (!this.isSecureContext()) {
      console.error('Storage access denied: Not a secure context');
      return false;
    }

    // Перевіряємо безпеку iframe
    if (!this.isIframeSafe()) {
      console.error('Storage access denied: Unsafe iframe configuration');
      return false;
    }

    // Перевіряємо походження
    if (!this.ALLOWED_ORIGINS.some(origin => window.location.hostname.includes(origin))) {
      console.error('Storage access denied: Invalid origin');
      return false;
    }

    return true;
  }

  private async init() {
    try {
      // Перевіряємо безпеку доступу до сховища
      const isStorageAccessAllowed = await this.validateStorageAccess();
      if (!isStorageAccessAllowed) {
        this.storageReady.next(false);
        throw new Error('Storage access denied due to security restrictions');
      }

      // Визначаємо, чи можемо використовувати Preferences API
      this.preferenceStorage = this.platform.is('capacitor');

      // Отримуємо дані
      const challenges = await this.getStorageData();
      
      // Якщо челенджів немає, створюємо базові
      if (!challenges || challenges.length === 0) {
        const defaultChallenges = this.getDefaultChallenges();
        await this.saveToAllStorages(defaultChallenges);
        console.log('Default challenges initialized');
      }

      this.storageReady.next(true);
      console.log('Storage is ready');
    } catch (error) {
      console.error('Storage initialization error:', error);
      this.storageReady.next(false);
      
      // Якщо основне сховище недоступне, спробуємо використовувати тільки Preferences
      if (this.preferenceStorage) {
        try {
          const { value } = await Preferences.get({ key: this.STORAGE_KEY });
          if (!value) {
            const defaultChallenges = this.getDefaultChallenges();
            await Preferences.set({
              key: this.STORAGE_KEY,
              value: JSON.stringify(defaultChallenges)
            });
          }
          this.storageReady.next(true);
        } catch (prefsError) {
          console.error('Preferences fallback failed:', prefsError);
        }
      }
    }
  }

  private async getStorageData(): Promise<any> {
    let data = null;

    // Спочатку пробуємо отримати дані з Preferences API
    if (this.preferenceStorage) {
      try {
        const { value } = await Preferences.get({ key: this.STORAGE_KEY });
        if (value) {
          data = JSON.parse(value);
          return data;
        }
      } catch (error) {
        console.error('Error reading from Preferences:', error);
      }
    }

    // Якщо дані не отримані з Preferences, пробуємо основне сховище
    try {
      data = await this.storageService.get(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error reading from storage:', error);
    }

    return data;
  }

  private async saveToAllStorages(data: any) {
    try {
      // Перевіряємо безпеку доступу до сховища
      const isStorageAccessAllowed = await this.validateStorageAccess();
      if (!isStorageAccessAllowed) {
        throw new Error('Storage access denied due to security restrictions');
      }

      // Зберігаємо в Preferences API, якщо доступно
      if (this.preferenceStorage) {
        try {
          await Preferences.set({
            key: this.STORAGE_KEY,
            value: JSON.stringify(data)
          });
        } catch (error) {
          console.error('Error saving to Preferences:', error);
        }
      }

      // Зберігаємо в основне сховище
      try {
        await this.storageService.set(this.STORAGE_KEY, data);
      } catch (error) {
        console.error('Error saving to storage:', error);
        // Якщо збереження в основне сховище не вдалося, але є Preferences
        if (!this.preferenceStorage) {
          throw error; // Перекидаємо помилку тільки якщо немає резервного сховища
        }
      }
    } catch (error) {
      console.error('Error saving to storages:', error);
      throw error;
    }
  }

  private async ensureStorageReady(): Promise<void> {
    if (!this.storageReady.value) {
      await this.init();
    }
    
    if (!this.storageReady.value) {
      throw new Error('Storage not initialized');
    }
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
      const challenges = await this.storageService.get(this.STORAGE_KEY) || [];
      challenges.push(challenge);
      await this.storageService.set(this.STORAGE_KEY, challenges);

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
      const challenges = await this.storageService.get(this.STORAGE_KEY) || [];
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
      const value = await this.storageService.get(key);
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
      await this.storageService.set(key, progress);
    } catch (error) {
      console.error('Error updating today progress:', error);
      throw error;
    }
  }

  async quitChallenge(challengeId: string): Promise<boolean> {
    try {
      const storage = await this.ensureStorageReady();
      const challenges = await this.storageService.get(this.STORAGE_KEY) || [];
      const challengeIndex = challenges.findIndex((c: Challenge) => c.id === challengeId);
      
      if (challengeIndex === -1) {
        throw new Error('Challenge not found');
      }

      challenges[challengeIndex].status = 'failed';
      await this.storageService.set(this.STORAGE_KEY, challenges);
      
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
      const challenges = await this.storageService.get(this.STORAGE_KEY) || [];
      
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
      await this.saveToAllStorages(Array.from(uniqueChallenges.values()));
    } catch (error) {
      console.error('Error cleaning up storage:', error);
    }
  }

  private getDefaultChallenges(): Challenge[] {
    return [
      {
        id: 'challenge-default-1',
        title: '40 Днів Здорових Звичок',
        description: 'Покращіть своє здоров\'я за 40 днів, формуючи корисні звички',
        duration: 40,
        tasks: [
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
        ],
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
      }
    ];
  }

  async getChallenges(): Promise<Challenge[]> {
    try {
      await this.cleanupStorage();
      const storage = await this.ensureStorageReady();
      let challenges = await this.storageService.get(this.STORAGE_KEY) || [];
      
      // Якщо челенджів немає, створюємо базові
      if (challenges.length === 0) {
        challenges = this.getDefaultChallenges();
        await this.saveToAllStorages(challenges);
      }
      
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
      const challenges = await this.storageService.get(this.STORAGE_KEY) || [];
      challenges.push(challenge);
      await this.saveToAllStorages(challenges);
    } catch (error) {
      console.error('Error adding challenge:', error);
      throw error;
    }
  }

  async updateChallenge(challenge: Challenge): Promise<void> {
    try {
      const storage = await this.ensureStorageReady();
      const challenges = await this.storageService.get(this.STORAGE_KEY) || [];
      const index = challenges.findIndex((c: Challenge) => c.id === challenge.id);
      if (index !== -1) {
        challenges[index] = challenge;
        await this.saveToAllStorages(challenges);
      }
    } catch (error) {
      console.error('Error updating challenge:', error);
      throw error;
    }
  }

  async deleteChallenge(id: string): Promise<void> {
    try {
      const storage = await this.ensureStorageReady();
      const challenges = await this.storageService.get(this.STORAGE_KEY) || [];
      const filtered = challenges.filter((c: Challenge) => c.id !== id);
      await this.saveToAllStorages(filtered);
    } catch (error) {
      console.error('Error deleting challenge:', error);
      throw error;
    }
  }

  async activateChallenge(challengeId: string): Promise<boolean> {
    try {
      const storage = await this.ensureStorageReady();
      const challenges = await this.storageService.get(this.STORAGE_KEY) || [];
      
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
      endDate.setDate(startDate.getDate() + (challenges[challengeIndex].duration || 40));

      // Форматуємо дати в ISO string з обробкою помилок
      let startDateISO: string;
      let endDateISO: string;
      
      try {
        startDateISO = startDate.toISOString();
        endDateISO = endDate.toISOString();
      } catch (error) {
        console.error('Error converting dates to ISO:', error);
        startDateISO = new Date().toISOString();
        endDateISO = new Date(Date.now() + (40 * 24 * 60 * 60 * 1000)).toISOString();
      }

      challenges[challengeIndex] = {
        ...challenges[challengeIndex],
        status: 'active',
        startDate: startDateISO,
        endDate: endDateISO
      };

      await this.saveToAllStorages(challenges);
      
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
      let challenges = await this.storageService.get(this.STORAGE_KEY) || [];
      
      // Змінюємо статус всіх челенджів на 'completed' та скидаємо дати
      challenges = challenges.map((challenge: Challenge) => ({
        ...challenge,
        status: 'completed',
        startDate: undefined,
        endDate: undefined,
        currentDay: undefined
      }));

      await this.saveToAllStorages(challenges);
      
      // Очищаємо активний челендж
      this.activeChallenge.next(null);

      const toast = await this.toastController.create({
        message: 'Всі челенджі доступні для активації',
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