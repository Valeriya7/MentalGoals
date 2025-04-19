import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { Challenge, ChallengePhase, ChallengeTask, ChallengeProgress } from '../interfaces/challenge.interface';
import { ModalService } from './modal.service';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@ionic/angular';
import { StorageService } from './storage.service';
import { TranslateService } from '@ngx-translate/core';

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
  private progressCache = new Map<string, ChallengeProgress>();
  private lastSyncTime = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 хвилин

  constructor(
    private toastController: ToastController,
    private modalService: ModalService,
    private storageService: StorageService,
    private platform: Platform,
    private translate: TranslateService
  ) {
    this.init();
    this.initializeActiveChallenge();
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
        // Перевіряємо атрибути sandbox
        const frameElement = window.frameElement;
        if (frameElement && frameElement.hasAttribute('sandbox')) {
          const sandbox = frameElement.getAttribute('sandbox') || '';
          // Перевіряємо небезпечну комбінацію
          if (sandbox.includes('allow-scripts') && sandbox.includes('allow-same-origin')) {
            console.error('Unsafe iframe configuration detected');
            return false;
          }
        }

        // Перевіряємо походження батьківського вікна
        try {
          const parentOrigin = window.parent.location.origin;
          if (!this.ALLOWED_ORIGINS.some(origin => parentOrigin.includes(origin))) {
            console.error('Parent frame origin not allowed');
            return false;
          }
        } catch {
          // Якщо не можемо отримати походження батьківського вікна, вважаємо це небезпечним
          console.error('Cannot access parent frame origin');
          return false;
        }
      }
      return true;
    } catch {
      // Якщо виникла помилка при перевірці, вважаємо це небезпечним
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
      message: this.translate.instant('CHALLENGES.SERVICE.SUCCESS.CHALLENGE_CREATED', { type }),
      duration: 2000,
      position: 'bottom',
      color: 'success',
      buttons: [{ text: this.translate.instant('CHALLENGES.SERVICE.SUCCESS.OK'), role: 'cancel' }]
    });
    await toast.present();
  }

  async startNewChallenge(type: string): Promise<boolean> {
    if (this.isLoading.value) {
      return false;
    }

    this.isLoading.next(true);

    try {
      await this.modalService.showLoading(this.translate.instant('CHALLENGES.LOADING'));

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 40);

      const tasks: ChallengeTask[] = [
        {
          id: 'no-sweets',
          title: this.translate.instant('CHALLENGES.TASKS.NO_SWEETS.TITLE'),
          description: this.translate.instant('CHALLENGES.TASKS.NO_SWEETS.DESCRIPTION'),
          icon: 'ice-cream-outline',
          completed: false,
          progress: 0
        },
        {
          id: 'no-coffee',
          title: this.translate.instant('CHALLENGES.TASKS.NO_COFFEE.TITLE'),
          description: this.translate.instant('CHALLENGES.TASKS.NO_COFFEE.DESCRIPTION'),
          icon: 'cafe-outline',
          completed: false,
          progress: 0
        },
        {
          id: 'exercise',
          title: this.translate.instant('CHALLENGES.TASKS.EXERCISE.TITLE'),
          description: this.translate.instant('CHALLENGES.TASKS.EXERCISE.DESCRIPTION'),
          icon: 'fitness-outline',
          completed: false,
          progress: 0
        },
        {
          id: 'steps',
          title: this.translate.instant('CHALLENGES.TASKS.STEPS.TITLE'),
          description: this.translate.instant('CHALLENGES.TASKS.STEPS.DESCRIPTION'),
          icon: 'footsteps-outline',
          completed: false,
          progress: 0
        },
        {
          id: 'english',
          title: this.translate.instant('CHALLENGES.TASKS.ENGLISH.TITLE'),
          description: this.translate.instant('CHALLENGES.TASKS.ENGLISH.DESCRIPTION'),
          icon: 'book-outline',
          completed: false,
          progress: 0
        }
      ];

      // Create a new challenge object
      const challenge: Challenge = {
        id: `challenge-${Date.now()}`,
        title: this.translate.instant('CHALLENGES.CHALLENGE_TITLE'),
        description: this.translate.instant('CHALLENGES.CHALLENGE_DESCRIPTION'),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        duration: 40,
        tasks: tasks,
        status: 'active',
        difficulty: 'expert',
        difficultyLevel: 5,
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
        },
        phases: [{
          id: 'phase-1',
          title: this.translate.instant('CHALLENGES.PHASE_TITLE'),
          tasks: tasks,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }]
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
      console.error(this.translate.instant('CHALLENGES.ERROR'), error);
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
      const challenges = await this.getChallenges();
      const challenge = challenges.find(c => c.id === id);
      if (challenge && challenge.status === 'active') {
        this.updateCurrentDay(challenge);
      }
      return challenge;
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

  private validateProgress(progress: any): boolean {
    if (!progress || typeof progress !== 'object') return false;

    // Перевіряємо структуру прогресу
    for (const dateKey in progress) {
      const dayProgress = progress[dateKey];

      if (!dayProgress.date || !dayProgress.tasks || typeof dayProgress.tasks !== 'object') {
        return false;
      }

      if (typeof dayProgress.completedTasks !== 'number' || typeof dayProgress.totalTasks !== 'number') {
        return false;
      }

      // Перевіряємо кожне завдання
      for (const taskId in dayProgress.tasks) {
        const task = dayProgress.tasks[taskId];
        if (typeof task.completed !== 'boolean' || typeof task.progress !== 'number') {
          return false;
        }
      }
    }

    return true;
  }

  private async saveProgress(challenge: Challenge): Promise<boolean> {
    try {
      if (!this.validateProgress(challenge.progress)) {
        console.error('Invalid progress data structure');
        return false;
      }

      const challenges = await this.getChallenges();
      const index = challenges.findIndex(c => c.id === challenge.id);

      if (index === -1) {
        console.error('Challenge not found');
        return false;
      }

      challenges[index] = challenge;
      await this.saveToAllStorages(challenges);

      if (challenge.status === 'active') {
        this.activeChallenge.next(challenge);
      }

      return true;
    } catch (error) {
      console.error('Error saving progress:', error);
      return false;
    }
  }

  async getTodayProgress(challengeId: string, date?: string): Promise<{ [key: string]: boolean }> {
    try {
      const challenge = await this.getChallenge(challengeId);
      if (!challenge?.progress) return {};

      const targetDate = date || new Date().toISOString().split('T')[0];
      const dayProgress = challenge.progress[targetDate]?.tasks || {};

      return Object.entries(dayProgress).reduce((acc, [taskId, task]) => {
        acc[taskId] = task.completed;
        return acc;
      }, {} as { [key: string]: boolean });
    } catch (error) {
      console.error('Error getting today progress:', error);
      return {};
    }
  }

  async updateTodayProgress(challengeId: string, taskId: string, completed: boolean): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const challenges = await this.getChallenges();
      const challengeIndex = challenges.findIndex(c => c.id === challengeId);

      if (challengeIndex === -1) {
        throw new Error('Challenge not found');
      }

      const challenge = challenges[challengeIndex];

      // Ініціалізуємо прогрес для сьогоднішнього дня, якщо його ще немає
      if (!challenge.progress) {
        challenge.progress = {};
      }

      if (!challenge.progress[today]) {
        challenge.progress[today] = {
          date: today,
          tasks: {},
          completedTasks: 0,
          totalTasks: challenge.tasks.length,
          lastUpdated: new Date().toISOString()
        };
      }

      // Оновлюємо стан завдання
      challenge.progress[today].tasks[taskId] = {
        completed,
        completedAt: completed ? new Date().toISOString() : null,
        progress: completed ? 100 : 0,
        date: today
      };

      // Оновлюємо кількість виконаних завдань
      challenge.progress[today].completedTasks = Object.values(challenge.progress[today].tasks)
        .filter(task => task.completed).length;

      // Оновлюємо час останнього оновлення
      challenge.progress[today].lastUpdated = new Date().toISOString();

      // Зберігаємо оновлений челендж
      await this.saveToAllStorages(challenges);

      // Оновлюємо локальний стан
      if (challenge.status === 'active') {
        this.activeChallenge.next(challenge);
      }

    } catch (error) {
      console.error('Error updating today progress:', error);
      throw error;
    }
  }

  async getChallengeProgress(challengeId: string): Promise<ChallengeProgress[]> {
    try {
      const challenge = await this.getChallenge(challengeId);
      if (!challenge?.progress) return [];

      return Object.values(challenge.progress).sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    } catch (error) {
      console.error('Error getting challenge progress:', error);
      return [];
    }
  }

  async getChallenges(): Promise<Challenge[]> {
    try {
      const storage = await this.ensureStorageReady();
      let challenges = await this.storageService.get(this.STORAGE_KEY) || [];

      //console.log('Current challenges in storage:', challenges);

      // Якщо немає челенджів, ініціалізуємо дефолтні
      if (!challenges || challenges.length === 0) {
        console.log('No challenges found, initializing defaults');
        challenges = this.getDefaultChallenges();
        await this.saveToAllStorages(challenges);
      }

      // Перевіряємо наявність всіх дефолтних челенджів
      const defaultChallenges = this.getDefaultChallenges();
      const existingIds = new Set(challenges.map((c: Challenge) => c.id));

      defaultChallenges.forEach(defaultChallenge => {
        if (!existingIds.has(defaultChallenge.id)) {
          //console.log('Adding missing default challenge:', defaultChallenge.id);
          challenges.push(defaultChallenge);
        }
      });

      await this.saveToAllStorages(challenges);
      //console.log('Final challenges list:', challenges);

      return challenges;
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
      const challenges = await this.getChallenges();
      const challengeIndex = challenges.findIndex(c => c.id === challengeId);

      if (challengeIndex === -1) return false;

      // Перевіряємо кількість активних челенджів
      const activeChallengesCount = challenges.filter(c => c.status === 'active').length;
      if (activeChallengesCount >= 3) {
        throw new Error('MAX_ACTIVE_CHALLENGES');
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + challenges[challengeIndex].duration);

      challenges[challengeIndex].status = 'active';
      challenges[challengeIndex].startDate = startDate.toISOString();
      challenges[challengeIndex].endDate = endDate.toISOString();
      challenges[challengeIndex].currentDay = 1;

      await this.saveToAllStorages(challenges);
      return true;
    } catch (error) {
      console.error('Error activating challenge:', error);
      if (error instanceof Error && error.message === 'MAX_ACTIVE_CHALLENGES') {
        throw error;
      }
      return false;
    }
  }

  private updateCurrentDay(challenge: Challenge): void {
    if (challenge.status === 'active' && challenge.startDate) {
      const startDate = new Date(challenge.startDate);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      challenge.currentDay = Math.min(diffDays, challenge.duration);
    }
  }

  async deactivateAllChallenges(): Promise<boolean> {
    try {
      const storage = await this.ensureStorageReady();
      const challenges = await this.storageService.get(this.STORAGE_KEY) || [];

      challenges.forEach((challenge: Challenge) => {
        if (challenge.status === 'active') {
          challenge.status = 'available';
          delete challenge.startDate;
          delete challenge.endDate;
          delete challenge.currentDay;
        }
      });

      await this.saveToAllStorages(challenges);
      return true;
    } catch (error) {
      console.error('Error deactivating challenges:', error);
      return false;
    }
  }

  async quitChallenge(challengeId: string): Promise<boolean> {
    try {
      const challenges = await this.getChallenges();
      const challengeIndex = challenges.findIndex(c => c.id === challengeId);

      if (challengeIndex === -1) return false;

      challenges[challengeIndex].status = 'available';
      delete challenges[challengeIndex].startDate;
      delete challenges[challengeIndex].endDate;

      await this.saveToAllStorages(challenges);
      return true;
    } catch (error) {
      console.error('Error quitting challenge:', error);
      return false;
    }
  }

  async completeChallenge(challengeId: string): Promise<boolean> {
    try {
      const challenges = await this.getChallenges();
      const challengeIndex = challenges.findIndex(c => c.id === challengeId);

      if (challengeIndex === -1) return false;

      challenges[challengeIndex].status = 'completed';
      challenges[challengeIndex].completedDate = new Date().toISOString();

      await this.saveToAllStorages(challenges);
      return true;
    } catch (error) {
      console.error('Error completing challenge:', error);
      return false;
    }
  }

  async updateTaskStatus(challengeId: string, taskId: string, completed: boolean): Promise<boolean> {
    try {
      const challenges = await this.getChallenges();
      const challengeIndex = challenges.findIndex(c => c.id === challengeId);

      if (challengeIndex === -1) return false;

      const taskIndex = challenges[challengeIndex].tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return false;

      challenges[challengeIndex].tasks[taskIndex].completed = completed;

      await this.saveToAllStorages(challenges);
      return true;
    } catch (error) {
      console.error('Error updating task status:', error);
      return false;
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
        difficulty: 'expert',
        difficultyLevel: 5,
        tasks: [
          {
            id: 'no-sweets',
            title: 'Без солодкого',
            description: 'Уникайте солодощів протягом дня',
            icon: 'ice-cream-outline',
            completed: false,
            progress: 0
          },
          {
            id: 'no-coffee',
            title: 'Без кави',
            description: 'Замініть каву на здорові альтернативи',
            icon: 'cafe-outline',
            completed: false,
            progress: 0
          },
          {
            id: 'exercise',
            title: '10 хвилин вправ',
            description: 'Виконайте комплекс вправ',
            icon: 'fitness-outline',
            completed: false,
            progress: 0
          },
          {
            id: 'steps',
            title: '8000 кроків',
            description: 'Пройдіть мінімум 8000 кроків',
            icon: 'footsteps-outline',
            completed: false,
            progress: 0
          },
          {
            id: 'english',
            title: '5 англійських слів',
            description: 'Вивчіть нові слова',
            icon: 'book-outline',
            completed: false,
            progress: 0
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
        },
        phases: [{
          id: 'phase-1',
          title: 'Основна фаза',
          tasks: [
            {
              id: 'no-sweets',
              title: 'Без солодкого',
              description: 'Уникайте солодощів протягом дня',
              icon: 'ice-cream-outline',
              completed: false,
              progress: 0
            },
            {
              id: 'no-coffee',
              title: 'Без кави',
              description: 'Замініть каву на здорові альтернативи',
              icon: 'cafe-outline',
              completed: false,
              progress: 0
            },
            {
              id: 'exercise',
              title: '10 хвилин вправ',
              description: 'Виконайте комплекс вправ',
              icon: 'fitness-outline',
              completed: false,
              progress: 0
            },
            {
              id: 'steps',
              title: '8000 кроків',
              description: 'Пройдіть мінімум 8000 кроків',
              icon: 'footsteps-outline',
              completed: false,
              progress: 0
            },
            {
              id: 'english',
              title: '5 англійських слів',
              description: 'Вивчіть нові слова',
              icon: 'book-outline',
              completed: false,
              progress: 0
            }
          ],
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString()
        }]
      },
      {
        id: 'challenge-gratitude',
        title: 'Ранкова подяка',
        description: 'Формування позитивного мислення та зменшення стресу через щоденну практику вдячності',
        duration: 7,
        difficulty: 'beginner',
        difficultyLevel: 1,
        tasks: [
          {
            id: 'gratitude-list',
            title: 'Список вдячності',
            description: 'Запишіть 3 речі, за які ви вдячні сьогодні',
            icon: 'heart-outline',
            completed: false,
            progress: 0
          }
        ],
        status: 'available',
        rewards: {
          points: 10,
          discounts: [
            {
              brand: 'Книгарня',
              amount: '10%'
            }
          ]
        },
        phases: [{
          id: 'phase-1',
          title: 'Фаза вдячності',
          tasks: [
            {
              id: 'gratitude-list',
              title: 'Список вдячності',
              description: 'Запишіть 3 речі, за які ви вдячні сьогодні',
              icon: 'heart-outline',
              completed: false,
              progress: 0
            }
          ],
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }]
      },
      {
        id: 'challenge-steps',
        title: '10 000 кроків до спокою',
        description: 'Покращення настрою через щоденну фізичну активність',
        duration: 7,
        difficulty: 'intermediate',
        difficultyLevel: 2,
        tasks: [
          {
            id: 'daily-steps',
            title: '10 000 кроків',
            description: 'Пройдіть мінімум 10 000 кроків за день',
            icon: 'footsteps-outline',
            completed: false,
            progress: 0
          }
        ],
        status: 'available',
        rewards: {
          points: 40,
          discounts: [
            {
              brand: 'Nike',
              amount: '15%'
            },
            {
              brand: 'Adidas',
              amount: '15%'
            },
            {
              brand: 'Columbia',
              amount: '15%'
            }
          ]
        },
        phases: [{
          id: 'phase-1',
          title: 'Фаза активності',
          tasks: [
            {
              id: 'daily-steps',
              title: '10 000 кроків',
              description: 'Пройдіть мінімум 10 000 кроків за день',
              icon: 'footsteps-outline',
              completed: false,
              progress: 0
            }
          ],
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }]
      },
      {
        id: 'challenge-digital-detox',
        title: 'Цифровий детокс',
        description: 'Поліпшення сну та зниження рівня тривожності через контроль використання гаджетів',
        duration: 10,
        difficulty: 'intermediate',
        difficultyLevel: 3,
        tasks: [
          {
            id: 'evening-offline',
            title: 'Вечірній офлайн',
            description: 'Вимкніть телефон за 1 годину до сну',
            icon: 'moon-outline',
            completed: false,
            progress: 0
          },
          {
            id: 'morning-offline',
            title: 'Ранковий офлайн',
            description: 'Не користуйтесь соцмережами 1 годину після пробудження',
            icon: 'sunny-outline',
            completed: false,
            progress: 0
          }
        ],
        status: 'available',
        rewards: {
          points: 10,
          discounts: [
            {
              brand: 'СПА-центр',
              amount: '20%'
            }
          ]
        },
        phases: [{
          id: 'phase-1',
          title: 'Фаза цифрового детоксу',
          tasks: [
            {
              id: 'evening-offline',
              title: 'Вечірній офлайн',
              description: 'Вимкніть телефон за 1 годину до сну',
              icon: 'moon-outline',
              completed: false,
              progress: 0
            },
            {
              id: 'morning-offline',
              title: 'Ранковий офлайн',
              description: 'Не користуйтесь соцмережами 1 годину після пробудження',
              icon: 'sunny-outline',
              completed: false,
              progress: 0
            }
          ],
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
        }]
      },
      {
        id: 'challenge-meditation',
        title: 'Медитація для початківців',
        description: 'Контроль думок та розслаблення через щоденну практику медитації',
        duration: 14,
        difficulty: 'intermediate',
        difficultyLevel: 3,
        tasks: [
          {
            id: 'daily-meditation',
            title: '5-хвилинна медитація',
            description: 'Виконайте медитацію протягом 5 хвилин',
            icon: 'leaf-outline',
            completed: false,
            progress: 0
          }
        ],
        status: 'available',
        rewards: {
          points: 60,
          discounts: [
            {
              brand: 'Преміум медитації',
              amount: '100%'
            },
            {
              brand: 'Аудіокниги',
              amount: '10%'
            }
          ]
        },
        phases: [{
          id: 'phase-1',
          title: 'Фаза медитації',
          tasks: [
            {
              id: 'daily-meditation',
              title: '5-хвилинна медитація',
              description: 'Виконайте медитацію протягом 5 хвилин',
              icon: 'leaf-outline',
              completed: false,
              progress: 0
            }
          ],
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        }]
      },
      {
        id: 'challenge-no-stress',
        title: 'Ні стресу',
        description: 'Контроль та подолання стресових ситуацій',
        duration: 21,
        difficulty: 'advanced',
        difficultyLevel: 4,
        tasks: [
          {
            id: 'stress-tracking',
            title: 'Відстеження стресу',
            description: 'Запишіть тригери стресу та способи їх подолання',
            icon: 'clipboard-outline',
            completed: false,
            progress: 0
          }
        ],
        status: 'available',
        rewards: {
          points: 100,
          discounts: [
            {
              brand: 'Вікенд-подорож',
              amount: '25%'
            },
            {
              brand: 'Йога-клас',
              amount: '100%'
            }
          ]
        },
        phases: [{
          id: 'phase-1',
          title: 'Фаза зменшення стресу',
          tasks: [
            {
              id: 'stress-tracking',
              title: 'Відстеження стресу',
              description: 'Запишіть тригери стресу та способи їх подолання',
              icon: 'clipboard-outline',
              completed: false,
              progress: 0
            }
          ],
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
        }]
      },
      {
        id: 'challenge-no-complaints',
        title: '30 днів без скарг',
        description: 'Покращення мислення та зменшення токсичності через контроль негативних висловлювань',
        duration: 30,
        difficulty: 'expert',
        difficultyLevel: 5,
        tasks: [
          {
            id: 'no-complaints',
            title: 'Без скарг',
            description: 'Утримуйтесь від скарг та негативних висловлювань',
            icon: 'happy-outline',
            completed: false,
            progress: 0
          }
        ],
        status: 'available',
        rewards: {
          points: 100,
          discounts: [
            {
              brand: 'Подарунок-сюрприз',
              amount: '100%'
            }
          ]
        },
        phases: [{
          id: 'phase-1',
          title: 'Фаза позитивного мислення',
          tasks: [
            {
              id: 'no-complaints',
              title: 'Без скарг',
              description: 'Утримуйтесь від скарг та негативних висловлювань',
              icon: 'happy-outline',
              completed: false,
              progress: 0
            }
          ],
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }]
      }
    ];
  }

  private async initializeActiveChallenge() {
    try {
      const challenges = await this.getChallenges();
      const activeChallenge = challenges.find(c => c.status === 'active');
      if (activeChallenge) {
        this.activeChallenge.next(activeChallenge);
      }
    } catch (error) {
      console.error('Error initializing active challenge:', error);
    }
  }

  async updateChallengeStatus(challengeId: string, status: 'active' | 'completed' | 'failed' | 'available'): Promise<void> {
    try {
      const challenges = await this.getChallenges();
      const challengeIndex = challenges.findIndex(c => c.id === challengeId);

      if (challengeIndex !== -1) {
        challenges[challengeIndex].status = status;
        await Preferences.set({ key: 'challenges', value: JSON.stringify(challenges) });
      }
    } catch (error) {
      console.error('Error updating challenge status:', error);
      throw error;
    }
  }

  async getChallengesProgress(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const challenges = await this.getChallenges();
      return challenges
        .filter((challenge: Challenge) => {
          if (!challenge.progress) return false;

          // Перевіряємо чи є прогрес в заданому періоді
          return Object.keys(challenge.progress).some(date => {
            const progressDate = new Date(date);
            return progressDate >= startDate && progressDate <= endDate;
          });
        })
        .map((challenge: Challenge) => {
          // Фільтруємо прогрес тільки за заданий період
          const periodProgress = Object.entries(challenge.progress || {})
            .filter(([date]) => {
              const progressDate = new Date(date);
              return progressDate >= startDate && progressDate <= endDate;
            })
            .map(([progressDate, progress]) => ({
              progressDate,
              ...progress
            }));

          return {
            ...challenge,
            periodProgress,
            completedTasks: periodProgress.reduce((sum, day) => sum + (day.completedTasks || 0), 0),
            totalTasks: challenge.tasks?.length || 0
          };
        });
    } catch (error) {
      console.error('Error getting challenges progress:', error);
      return [];
    }
  }
}
