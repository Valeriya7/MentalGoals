import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private tokenSubject = new BehaviorSubject<string | null>(null);
  token$ = this.tokenSubject.asObservable();

  constructor() {
    // Load token from storage on init
    this.loadToken();
  }

  private async loadToken() {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        this.tokenSubject.next(token);
      }
    } catch (error) {
      console.error('Error loading token:', error);
    }
  }

  setToken(token: string) {
    this.tokenSubject.next(token);
    localStorage.setItem('authToken', token);
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  clearToken() {
    this.tokenSubject.next(null);
    localStorage.removeItem('authToken');
  }
} 