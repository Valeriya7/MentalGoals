import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  private http = inject(HttpClient);
  private currentLang = new BehaviorSubject<string>('en');
  private translations: any = {};
  private defaultLang = 'en';

  constructor() {
    this.loadSavedLanguage();
  }

  async loadSavedLanguage() {
    const { value } = await Preferences.get({ key: 'language' });
    if (value) {
      await this.setLanguage(value);
    } else {
      await this.setLanguage(this.defaultLang);
    }
  }

  async setLanguage(lang: string) {
    if (this.translations[lang]) {
      this.currentLang.next(lang);
      await Preferences.set({ key: 'language', value: lang });
    } else {
      await this.loadTranslations(lang);
    }
  }

  private loadTranslations(lang: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get(`/assets/i18n/${lang}.json`).subscribe(
        (translations: any) => {
          this.translations[lang] = translations;
          this.currentLang.next(lang);
          Preferences.set({ key: 'language', value: lang });
          resolve();
        },
        (error) => {
          console.error(`Failed to load translations for ${lang}:`, error);
          this.setLanguage(this.defaultLang);
          reject(error);
        }
      );
    });
  }

  getCurrentLang(): Observable<string> {
    return this.currentLang.asObservable();
  }

  translate(key: string): string {
    const keys = key.split('.');
    let value = this.translations[this.currentLang.value];
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }
    
    return value || key;
  }
} 