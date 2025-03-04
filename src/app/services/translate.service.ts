import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  private http = inject(HttpClient);
  private currentLang = new BehaviorSubject<string>('en');
  private translations: any = {};
  private defaultLang = 'en';
  private translationsLoaded = new BehaviorSubject<boolean>(false);

  constructor() {
    this.loadSavedLanguage();
  }

  async loadSavedLanguage() {
    try {
      const { value } = await Preferences.get({ key: 'language' });
      if (value) {
        await this.setLanguage(value);
      } else {
        await this.setLanguage(this.defaultLang);
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
      await this.setLanguage(this.defaultLang);
    }
  }

  async setLanguage(lang: string) {
    console.log(`Setting language to: ${lang}`);
    try {
      if (this.translations[lang]) {
        console.log(`Using cached translations for ${lang}`);
        this.currentLang.next(lang);
        await Preferences.set({ key: 'language', value: lang });
      } else {
        console.log(`Loading translations for ${lang}`);
        await this.loadTranslations(lang);
      }
    } catch (error) {
      console.error(`Error setting language ${lang}:`, error);
      if (lang !== this.defaultLang) {
        await this.setLanguage(this.defaultLang);
      }
    }
  }

  private async loadTranslations(lang: string): Promise<void> {
    try {
      console.log(`Fetching translations from: /assets/i18n/${lang}.json`);
      const translations = await firstValueFrom(this.http.get(`/assets/i18n/${lang}.json`));
      console.log(`Translations loaded for ${lang}:`, translations);
      this.translations[lang] = translations;
      this.currentLang.next(lang);
      this.translationsLoaded.next(true);
      await Preferences.set({ key: 'language', value: lang });
    } catch (error) {
      console.error(`Failed to load translations for ${lang}:`, error);
      if (lang !== this.defaultLang) {
        await this.setLanguage(this.defaultLang);
      } else {
        throw new Error(`Failed to load translations for default language ${this.defaultLang}`);
      }
    }
  }

  getCurrentLang(): Observable<string> {
    return this.currentLang.asObservable();
  }

  isTranslationsLoaded(): Observable<boolean> {
    return this.translationsLoaded.asObservable();
  }

  translate(key: string): string {
    const keys = key.split('.');
    let value = this.translations[this.currentLang.value];
    
    console.log(`Translating key: ${key}`);
    console.log(`Current language: ${this.currentLang.value}`);
    console.log(`Available translations:`, this.translations);
    
    if (!value) {
      console.warn(`No translations available for language: ${this.currentLang.value}`);
      return key;
    }
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key} (current part: ${k})`);
        console.warn(`Available keys at this level:`, Object.keys(value || {}));
        return key;
      }
    }
    
    return value || key;
  }
} 