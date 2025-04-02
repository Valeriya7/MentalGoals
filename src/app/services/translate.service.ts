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
  private availableLanguages = ['uk', 'en', 'de'];

  constructor(private translate: NgxTranslateService) {
    console.log('TranslateService initialized');
    this.translate.addLangs(this.availableLanguages);
    this.translate.setDefaultLang(this.defaultLang);
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
      // Спочатку перевіряємо збережену мову
      const { value: savedLang } = await Preferences.get({ key: 'language' });
      console.log('Saved language:', savedLang);
      
      if (savedLang && this.availableLanguages.includes(savedLang)) {
        await this.setLanguage(savedLang);
        return;
      }

      // Якщо збереженої мови немає, перевіряємо мову пристрою
      const { value: deviceLang } = await Device.getLanguageCode();
      console.log('Device language:', deviceLang);

      // Отримуємо основний код мови (наприклад, 'uk' з 'uk-UA')
      const languageCode = deviceLang.split('-')[0].toLowerCase();
      console.log('Extracted language code:', languageCode);

      if (this.availableLanguages.includes(languageCode)) {
        await this.setLanguage(languageCode);
      } else {
        console.log('Device language not supported, using default:', this.defaultLang);
        await this.setLanguage(this.defaultLang);
      }
    } catch (error) {
      console.error('Error initializing language:', error);
      await this.setLanguage(this.defaultLang);
    }
  }

  async loadSavedLanguage() {
    try {
      console.log('Loading saved language...');
      const { value } = await Preferences.get({ key: 'language' });
      console.log('Retrieved saved language:', value);
      
      if (value && this.availableLanguages.includes(value)) {
        await this.setLanguage(value);
      } else {
        console.log('No valid saved language, initializing...');
        await this.initializeLanguage();
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
      await this.setLanguage(this.defaultLang);
    }
  }

  async setLanguage(lang: string) {
    try {
      if (!this.availableLanguages.includes(lang)) {
        throw new Error(`Language ${lang} is not supported`);
      }
      
      console.log(`Setting language to: ${lang}`);
      await this.translate.use(lang);
      this.currentLang.next(lang);
      await Preferences.set({ key: 'language', value: lang });
      console.log(`Language set successfully to: ${lang}`);
    } catch (error) {
      console.error(`Error setting language ${lang}:`, error);
      if (lang !== this.defaultLang) {
        console.log('Falling back to default language');
        await this.setLanguage(this.defaultLang);
      }
    }
  }

  getCurrentLang(): Observable<string> {
    return this.currentLang.asObservable();
  }

  instant(key: string, params?: any): string {
    return this.translate.instant(key, params);
  }

  get(key: string, params?: any): Observable<string> {
    return this.translate.get(key, params);
  }
} 