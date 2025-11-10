import { Injectable } from '@angular/core';
import { TranslateService as NgxTranslateService } from '@ngx-translate/core';
import { Preferences } from '@capacitor/preferences';
import { Device } from '@capacitor/device';
import { BehaviorSubject, Observable } from 'rxjs';
import { LangChangeEvent } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  private currentLang = new BehaviorSubject<string>('en');
  private defaultLang = 'en';
  private availableLanguages = ['en', 'uk'];

  constructor(private translate: NgxTranslateService) {
    console.log('TranslateService initialized');
    this.translate.addLangs(this.availableLanguages);
    this.translate.setDefaultLang(this.defaultLang);
    // Асинхронно ініціалізуємо мову
    this.initializeLanguage();
  }

  get onLangChange(): Observable<LangChangeEvent> {
    return this.translate.onLangChange;
  }

  get currentLanguage(): string {
    return this.translate.currentLang;
  }

  private async initializeLanguage() {
    try {
      console.log('Initializing language...');
      
      // Спочатку намагаємося завантажити збережену мову
      const { value: savedLanguage } = await Preferences.get({ key: 'language' });
      
      if (savedLanguage && this.availableLanguages.includes(savedLanguage)) {
        console.log('Using saved language:', savedLanguage);
        this.translate.use(savedLanguage);
        this.currentLang.next(savedLanguage);
      } else {
        // Якщо збереженої мови немає, використовуємо англійську за замовчуванням
        console.log('Using default language:', this.defaultLang);
        this.translate.use(this.defaultLang);
        this.currentLang.next(this.defaultLang);
        await Preferences.set({ key: 'language', value: this.defaultLang });
      }
      
      console.log('Language initialized successfully:', this.translate.currentLang);
    } catch (error) {
      console.error('Error initializing language:', error);
      // Якщо помилка, встановлюємо англійську
      this.translate.use(this.defaultLang);
      this.currentLang.next(this.defaultLang);
    }
  }

  async loadSavedLanguage() {
    try {
      console.log('Loading saved language...');
      
      // Завантажуємо збережену мову
      const { value: savedLanguage } = await Preferences.get({ key: 'language' });
      
      if (savedLanguage && this.availableLanguages.includes(savedLanguage)) {
        console.log('Loading saved language:', savedLanguage);
        await this.setLanguage(savedLanguage);
      } else {
        console.log('No saved language found, using default:', this.defaultLang);
        await this.setLanguage(this.defaultLang);
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
      // Якщо помилка, встановлюємо англійську
      this.translate.use(this.defaultLang);
      this.currentLang.next(this.defaultLang);
    }
  }

  async setLanguage(lang: string) {
    try {
      if (!this.availableLanguages.includes(lang)) {
        throw new Error(`Language ${lang} is not supported`);
      }
      
      console.log(`Setting language to: ${lang}`);
      this.translate.use(lang);
      this.currentLang.next(lang);
      await Preferences.set({ key: 'language', value: lang });
      console.log(`Language set successfully to: ${lang}`);
      console.log(`Current language after set: ${this.translate.currentLang}`);
    } catch (error) {
      console.error(`Error setting language ${lang}:`, error);
      if (lang !== this.defaultLang) {
        console.log('Falling back to default language');
        await this.setLanguage(this.defaultLang);
      }
    }
  }

  getCurrentLang(): Observable<string> {
    console.log('TranslateService.getCurrentLang():', this.translate.currentLang);
    return this.currentLang.asObservable();
  }

  instant(key: string, params?: any): string {
    return this.translate.instant(key, params);
  }

  get(key: string, params?: any): Observable<string> {
    return this.translate.get(key, params);
  }
} 