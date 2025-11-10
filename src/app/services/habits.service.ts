import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { Habit } from '../interfaces/habit.interface';
import { Preferences } from '@capacitor/preferences';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class HabitsService {
  private habits = new BehaviorSubject<Habit[]>([]);
  private readonly STORAGE_KEY = 'habits';
  private readonly CACHE_VERSION_KEY = 'habits_cache_version';
  private readonly CURRENT_CACHE_VERSION = '2.1';

  constructor(
    private http: HttpClient,
    private translate: TranslateService
  ) {
    this.loadHabits();
  }

  private async loadHabits() {
    try {
      console.log('=== LOAD HABITS START ===');
      
      // Перевіряємо версію кешу
      const { value: cacheVersion } = await Preferences.get({ key: this.CACHE_VERSION_KEY });
      console.log('HabitsService - Cache version:', cacheVersion);
      console.log('HabitsService - Current version:', this.CURRENT_CACHE_VERSION);
      
      const { value } = await Preferences.get({ key: this.STORAGE_KEY });
      console.log('loadHabits - Raw value from storage:', value ? 'exists' : 'null');
      console.log('loadHabits - Value length:', value?.length || 0);
      
      // Якщо кеш застарілий або відсутній, завантажуємо нові дані
      if (!value || !cacheVersion || cacheVersion !== this.CURRENT_CACHE_VERSION) {
        console.log('HabitsService - Cache outdated or missing, loading fresh data');
        const initialHabits = await this.getInitialHabits();
        console.log('Initial habits loaded:', initialHabits.length);
        this.habits.next(initialHabits);
        await this.saveHabits(initialHabits);
        await Preferences.set({ key: this.CACHE_VERSION_KEY, value: this.CURRENT_CACHE_VERSION });
      } else {
        console.log('HabitsService - Using cached habits');
        
        // Перевіряємо чи дані українською мовою (ознака застарілого кешу)
        const parsedHabits = JSON.parse(value);
        console.log('Parsed habits count:', parsedHabits.length);
        
        if (parsedHabits.length > 0) {
          console.log('First parsed habit:', {
            id: parsedHabits[0].id,
            name: parsedHabits[0].name,
            isActive: parsedHabits[0].isActive,
            completionStatus: parsedHabits[0].completionStatus
          });
        }
        
        if (parsedHabits.length > 0 && parsedHabits[0].name && parsedHabits[0].name.includes('Ранкова')) {
          console.log('HabitsService - Detected Ukrainian cached data, forcing reload');
          const initialHabits = await this.getInitialHabits();
          this.habits.next(initialHabits);
          await this.saveHabits(initialHabits);
          await Preferences.set({ key: this.CACHE_VERSION_KEY, value: this.CURRENT_CACHE_VERSION });
        } else {
          console.log('HabitsService - Using cached habits (not Ukrainian)');
          this.habits.next(parsedHabits);
        }
      }
      
      console.log('=== LOAD HABITS END ===');
      
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  }

  private async saveHabits(habits: Habit[]) {
    console.log('=== SAVE HABITS START ===');
    console.log('saveHabits called with habits:', habits.length);
    console.log('Storage key:', this.STORAGE_KEY);
    
    if (habits.length > 0) {
      console.log('First habit before save:', {
        id: habits[0].id,
        name: habits[0].name,
        isActive: habits[0].isActive,
        completionStatus: habits[0].completionStatus
      });
    }
    
    try {
      const habitsJson = JSON.stringify(habits);
      console.log('Habits JSON length:', habitsJson.length);
      
      const result = await Preferences.set({
        key: this.STORAGE_KEY,
        value: habitsJson
      });
      console.log('Preferences.set result:', result);
      
      // Перевіряємо що збереглося
      const { value: savedValue } = await Preferences.get({ key: this.STORAGE_KEY });
      console.log('Verification - saved value exists:', !!savedValue);
      console.log('Verification - saved value length:', savedValue?.length || 0);
      
      if (savedValue) {
        const parsedSaved = JSON.parse(savedValue);
        console.log('Verification - parsed habits count:', parsedSaved.length);
        if (parsedSaved.length > 0) {
          console.log('Verification - first saved habit:', {
            id: parsedSaved[0].id,
            name: parsedSaved[0].name,
            isActive: parsedSaved[0].isActive,
            completionStatus: parsedSaved[0].completionStatus
          });
        }
      }
      
    } catch (error) {
      console.error('Error saving habits:', error);
    }
    console.log('=== SAVE HABITS END ===');
  }

  getHabits(): Observable<Habit[]> {
    return new Observable(subscriber => {
      this.habits.subscribe(habits => {
        // Фільтруємо тільки активні звички (isActive == true)
        const activeHabits = habits.filter(habit => habit.isActive === true);
        console.log('getHabits - Total habits:', habits.length);
        console.log('getHabits - Active habits:', activeHabits.length);
        subscriber.next(activeHabits);
      });
    });
  }

  // Метод для отримання всіх звичок (включаючи неактивні)
  getAllHabits(): Observable<Habit[]> {
    return this.habits.asObservable();
  }

  // Тестовий метод для перевірки збереження/завантаження
  async testSaveAndLoad(): Promise<void> {
    console.log('=== TEST SAVE AND LOAD ===');
    
    // Отримуємо всі звички
    const allHabits = this.habits.value;
    console.log('All habits count:', allHabits.length);
    
    // Отримуємо тільки активні звички
    const activeHabits = allHabits.filter(habit => habit.isActive === true);
    console.log('Active habits count:', activeHabits.length);
    
    // Показуємо деталі по кожній звичці
    allHabits.forEach((habit, index) => {
      console.log(`Habit ${index + 1}:`, {
        id: habit.id,
        name: habit.name,
        isActive: habit.isActive,
        completionStatus: habit.completionStatus
      });
    });
    
    // Зберігаємо
    await this.saveHabits(allHabits);
    
    // Відразу завантажуємо
    const { value } = await Preferences.get({ key: this.STORAGE_KEY });
    console.log('Loaded value exists:', !!value);
    
    if (value) {
      const loadedHabits = JSON.parse(value);
      console.log('Loaded habits count:', loadedHabits.length);
      
      const loadedActiveHabits = loadedHabits.filter((habit: any) => habit.isActive === true);
      console.log('Loaded active habits count:', loadedActiveHabits.length);
      
      if (loadedHabits.length > 0) {
        console.log('First loaded habit:', {
          id: loadedHabits[0].id,
          name: loadedHabits[0].name,
          isActive: loadedHabits[0].isActive,
          completionStatus: loadedHabits[0].completionStatus
        });
      }
      
      // Порівнюємо
      console.log('Comparison - Same total count:', allHabits.length === loadedHabits.length);
      console.log('Comparison - Same active count:', activeHabits.length === loadedActiveHabits.length);
      console.log('Comparison - Same first habit name:', allHabits.length > 0 && loadedHabits.length > 0 ? 
        allHabits[0].name === loadedHabits[0].name : 'N/A');
    }
    
    console.log('=== TEST SAVE AND LOAD END ===');
  }

  async refreshHabits(): Promise<void> {
    console.log('HabitsService - Forcing refresh of habits data');
    const initialHabits = await this.getInitialHabits();
    this.habits.next(initialHabits);
    await this.saveHabits(initialHabits);
    await Preferences.set({ key: this.CACHE_VERSION_KEY, value: this.CURRENT_CACHE_VERSION });
  }

  getActiveHabits(): Observable<Habit[]> {
    return new Observable(subscriber => {
      this.habits.subscribe(habits => {
        subscriber.next(habits.filter(habit => habit.isActive));
      });
    });
  }

  getAvailableHabits(): Observable<Habit[]> {
    return new Observable(subscriber => {
      this.habits.subscribe(habits => {
        subscriber.next(habits.filter(habit => !habit.isActive));
      });
    });
  }

  async toggleHabit(habitId: string, date: string, status: 'completed' | 'partial' | 'not_completed') {
    const habits = this.habits.value;
    const habitIndex = habits.findIndex(h => h.id === habitId);

    if (habitIndex !== -1) {
      const habit = habits[habitIndex];
      if (!habit.isActive) {
        throw new Error('Cannot toggle inactive habit');
      }
      habit.completionStatus[date] = status;
      this.habits.next(habits);
      await this.saveHabits(habits);
      this.updateStreak(habitId);
    }
  }

  async activateHabit(habitId: string) {
    const habits = this.habits.value;
    const habitIndex = habits.findIndex(h => h.id === habitId);

    if (habitIndex !== -1) {
      habits[habitIndex].isActive = true;
      this.habits.next(habits);
      await this.saveHabits(habits);
    }
  }

  async deactivateHabit(habitId: string) {
    const habits = this.habits.value;
    const habitIndex = habits.findIndex(h => h.id === habitId);

    if (habitIndex !== -1) {
      habits[habitIndex].isActive = false;
      this.habits.next(habits);
      await this.saveHabits(habits);
    }
  }

  public async updateStreak(habitId: string): Promise<boolean> {
    const habits = await firstValueFrom(this.getHabits());
    const habit = habits.find((h: Habit) => h.id === habitId);
    if (!habit) return false;

    const today = new Date().toISOString().split('T')[0];
    const completionStatus = habit.completionStatus[today];

    if (completionStatus === 'completed') {
      if (habit.frequency === 'daily') {
        // Для щоденних звичок
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (habit.completionStatus[yesterdayStr] === 'completed') {
          habit.streak.current++;
          if (habit.streak.current > habit.streak.best) {
            habit.streak.best = habit.streak.current;
          }
        } else {
          habit.streak.current = 1;
        }
      } else if (habit.frequency === 'weekly') {
        // Для тижневих звичок
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastWeekStr = lastWeek.toISOString().split('T')[0];
        
        if (habit.completionStatus[lastWeekStr] === 'completed') {
          habit.streak.current++;
          if (habit.streak.current > habit.streak.best) {
            habit.streak.best = habit.streak.current;
          }
        } else {
          habit.streak.current = 1;
        }
      }
    }

    // Перевіряємо, чи досягнуто ціль
    if (habit.streak.current >= habit.target) {
      habit.isActive = false;
      await this.saveHabits(habits);
      return true;
    }

    await this.saveHabits(habits);
    return false;
  }

  private getLastCompletedDate(habit: Habit): string | null {
    const dates = Object.keys(habit.completionStatus)
      .filter(date => habit.completionStatus[date] === 'completed')
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    return dates.length > 0 ? dates[0] : null;
  }

  private getDaysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private async getInitialHabits(): Promise<Habit[]> {
    try {
      const data = await this.http.get<any>('./assets/data/habits.json').toPromise();
      
      // Визначаємо поточну мову з більш надійною логікою
      let currentLang = 'en'; // За замовчуванням англійська
      
      if (this.translate.currentLang) {
        currentLang = this.translate.currentLang;
      } else if (this.translate.defaultLang) {
        currentLang = this.translate.defaultLang;
      }
      
      console.log('getInitialHabits: Using language:', currentLang);
      console.log('getInitialHabits: Available languages in data:', Object.keys(data.habits[0].name || {}));
      
      return data.habits.map((habit: any) => ({
        ...habit,
        name: habit.name[currentLang] || habit.name.en || habit.name,
        description: habit.description[currentLang] || habit.description.en || habit.description
      }));
    } catch (error) {
      console.error('Error loading habits from file:', error);
      // Fallback to hardcoded English habits
      return this.getFallbackHabits();
    }
  }

  private getFallbackHabits(): Habit[] {
    return [
      {
        id: '1',
        name: 'Morning Meditation',
        description: '10 minutes of meditation daily',
        icon: 'leaf-outline',
        category: 'mindfulness',
        difficulty: 'easy',
        points: 10,
        isActive: true,
        isChallengeHabit: false,
        isBaseHabit: true,
        completionStatus: {},
        streak: { current: 0, best: 0 },
        target: 10,
        unit: 'minutes',
        frequency: 'daily',
        progress: {}
      },
      {
        id: '2',
        name: 'Breathing Exercises',
        description: '5 minutes of breathing exercises',
        icon: 'heart-outline',
        category: 'mindfulness',
        difficulty: 'easy',
        points: 5,
        isActive: true,
        isChallengeHabit: false,
        isBaseHabit: true,
        completionStatus: {},
        streak: { current: 0, best: 0 },
        target: 5,
        unit: 'minutes',
        frequency: 'daily',
        progress: {}
      },
      {
        id: '3',
        name: '8000 Steps',
        description: 'Walk at least 8000 steps',
        icon: 'footsteps-outline',
        category: 'fitness',
        difficulty: 'medium',
        points: 15,
        isActive: false,
        isChallengeHabit: false,
        isBaseHabit: true,
        completionStatus: {},
        streak: { current: 0, best: 0 },
        target: 8000,
        unit: 'steps',
        frequency: 'daily',
        progress: {}
      },
      {
        id: '4',
        name: 'No Sweets',
        description: 'Avoid sweets throughout the day',
        icon: 'ice-cream-outline',
        category: 'nutrition',
        difficulty: 'hard',
        points: 20,
        isActive: false,
        isChallengeHabit: false,
        isBaseHabit: true,
        completionStatus: {},
        streak: { current: 0, best: 0 },
        target: 1,
        unit: 'day',
        frequency: 'daily',
        progress: {}
      },
      {
        id: '5',
        name: '5 English Words',
        description: 'Learn new words',
        icon: 'book-outline',
        category: 'learning',
        difficulty: 'easy',
        points: 10,
        isActive: false,
        isChallengeHabit: false,
        completionStatus: {},
        streak: { current: 0, best: 0 },
        target: 5,
        unit: 'words',
        frequency: 'daily',
        progress: {}
      }
    ];
  }

  async createHabit(habit: Habit): Promise<void> {
    const habits = this.habits.value;
    habits.push(habit);
    this.habits.next(habits);
    await this.saveHabits(habits);
  }

  async updateHabit(habit: Habit): Promise<void> {
    const habits = this.habits.value;
    const habitIndex = habits.findIndex(h => h.id === habit.id);

    if (habitIndex !== -1) {
      habits[habitIndex] = habit;
      this.habits.next(habits);
      await this.saveHabits(habits);
    }
  }

  async deleteHabit(habitId: string): Promise<void> {
    const habits = this.habits.value;
    const filteredHabits = habits.filter(h => h.id !== habitId);
    this.habits.next(filteredHabits);
    await this.saveHabits(filteredHabits);
  }
}
