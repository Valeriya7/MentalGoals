import { Injectable } from '@angular/core';
import { TranslateService as NgxTranslateService } from '@ngx-translate/core';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  private currentLang = new BehaviorSubject<string>('en');
  private defaultLang = 'en';

  constructor(private translate: NgxTranslateService) {
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
    try {
      console.log(`Setting language to: ${lang}`);
      this.translate.setDefaultLang(this.defaultLang);
      this.translate.use(lang);
      this.currentLang.next(lang);
      await Preferences.set({ key: 'language', value: lang });
    } catch (error) {
      console.error(`Error setting language ${lang}:`, error);
      if (lang !== this.defaultLang) {
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