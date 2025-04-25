import { Injectable } from '@angular/core';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor(private router: Router) {
    this.setupScreenTracking();
  }

  private setupScreenTracking() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.setCurrentScreen(event.urlAfterRedirects);
    });
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
} 