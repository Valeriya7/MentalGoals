import { Injectable } from '@angular/core';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { Router, NavigationEnd, NavigationStart } from '@angular/router';
import { filter } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private pageStartTime: number = 0;
  private currentPage: string = '';
  private isPageActive = new BehaviorSubject<boolean>(false);

  constructor(private router: Router) {
    this.setupScreenTracking();
    this.setupPageTiming();
  }

  private setupScreenTracking() {
    // Відстеження початку навігації
    this.router.events.pipe(
      filter(event => event instanceof NavigationStart)
    ).subscribe((event: NavigationStart) => {
      this.logPageExit();
      this.currentPage = event.url;
      this.pageStartTime = Date.now();
      this.isPageActive.next(true);
    });

    // Відстеження завершення навігації
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.setCurrentScreen(event.urlAfterRedirects);
      this.logPageView(event.urlAfterRedirects);
    });
  }

  private setupPageTiming() {
    // Відстеження часу перебування на сторінці
    this.isPageActive.subscribe(isActive => {
      if (!isActive && this.pageStartTime > 0) {
        const timeSpent = Date.now() - this.pageStartTime;
        this.logEvent('page_time_spent', {
          page: this.currentPage,
          time_spent_ms: timeSpent
        });
      }
    });
  }

  private logPageExit() {
    if (this.pageStartTime > 0) {
      const timeSpent = Date.now() - this.pageStartTime;
      this.logEvent('page_exit', {
        page: this.currentPage,
        time_spent_ms: timeSpent
      });
    }
  }

  private async logPageView(url: string) {
    try {
      // Логуємо перегляд сторінки
      await this.logEvent('page_view', {
        page_url: url,
        page_title: document.title,
        page_path: this.getPagePath(url)
      });

      // Встановлюємо поточний екран
      await this.setCurrentScreen(url);
    } catch (error) {
      console.error('Error logging page view:', error);
    }
  }

  private getPagePath(url: string): string {
    return url.split('?')[0]; // Видаляємо параметри запиту
  }

  async setCurrentScreen(screenName: string) {
    try {
      await FirebaseAnalytics.setCurrentScreen({
        screenName,
        screenClassOverride: screenName
      });
    } catch (error) {
      console.error('Error setting current screen:', error);
    }
  }

  async logEvent(eventName: string, params?: { [key: string]: any }) {
    try {
      await FirebaseAnalytics.logEvent({
        name: eventName,
        params: params || {}
      });
    } catch (error) {
      console.error('Error logging event:', error);
    }
  }

  async setUserProperty(name: string, value: string) {
    try {
      await FirebaseAnalytics.setUserProperty({
        key: name,
        value: value
      });
    } catch (error) {
      console.error('Error setting user property:', error);
    }
  }

  async setUserId(userId: string) {
    try {
      await FirebaseAnalytics.setUserId({
        userId
      });
    } catch (error) {
      console.error('Error setting user ID:', error);
    }
  }

  // Додаткові методи для відстеження взаємодії
  async logButtonClick(buttonName: string, page: string) {
    await this.logEvent('button_click', {
      button_name: buttonName,
      page: page
    });
  }

  async logFormSubmission(formName: string, success: boolean) {
    await this.logEvent('form_submission', {
      form_name: formName,
      success: success
    });
  }

  async logError(errorMessage: string, page: string) {
    await this.logEvent('error_occurred', {
      error_message: errorMessage,
      page: page
    });
  }
} 