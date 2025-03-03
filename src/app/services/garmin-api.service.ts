import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { from, Observable, firstValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Preferences } from '@capacitor/preferences';
import { GarminConfig } from '../interfaces/api-config.interface';
import { HealthData, SleepData, ActivityData, StressData } from '../interfaces/health-data.interface';

@Injectable({
  providedIn: 'root'
})
export class GarminApiService {
  private readonly BASE_URL = 'https://api.garmin.com';
  private readonly AUTH_URL = 'https://connect.garmin.com/oauth-service/oauth/authorize';
  private config: GarminConfig = {
    clientId: 'YOUR_CLIENT_ID',
    clientSecret: 'YOUR_CLIENT_SECRET',
    apiKey: 'YOUR_API_KEY',
    redirectUri: 'your-app://callback'
  };

  constructor(private http: HttpClient) {}

  async authorize(): Promise<boolean> {
    try {
      const authUrl = this.getAuthorizationUrl();
      // Відкриваємо вікно авторизації
      window.open(authUrl, '_blank');
      
      // Очікуємо callback з токеном
      const token = await this.handleAuthCallback();
      if (token) {
        await Preferences.set({ key: 'garmin_token', value: token });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Garmin authorization error:', error);
      return false;
    }
  }

  private getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: 'activity sleep stress'
    });

    return `${this.AUTH_URL}?${params.toString()}`;
  }

  private async handleAuthCallback(): Promise<string> {
    // Імітація отримання токену
    return new Promise((resolve) => setTimeout(() => resolve('mock_token'), 1000));
  }

  async getSleepData(date: Date): Promise<SleepData> {
    const token = await Preferences.get({ key: 'garmin_token' });
    if (!token.value) throw new Error('Not authorized');

    const headers = this.getHeaders(token.value);
    const endpoint = '/sleep/daily';
    const params = { date: date.toISOString().split('T')[0] };
    
    const response = await firstValueFrom(
      this.http.get<SleepData>(`${this.BASE_URL}${endpoint}`, { headers, params })
    );
    
    if (!response) {
      throw new Error('Failed to fetch sleep data');
    }
    
    return response;
  }

  async getActivityData(): Promise<ActivityData> {
    const token = await Preferences.get({ key: 'garmin_token' });
    if (!token.value) throw new Error('Not authorized');

    const headers = this.getHeaders(token.value);
    const endpoint = '/activity/current';
    
    const response = await firstValueFrom(
      this.http.get<ActivityData>(`${this.BASE_URL}${endpoint}`, { headers })
    );
    
    if (!response) {
      throw new Error('Failed to fetch activity data');
    }
    
    return response;
  }

  async getStressData(): Promise<StressData> {
    const token = await Preferences.get({ key: 'garmin_token' });
    if (!token.value) throw new Error('Not authorized');

    const headers = this.getHeaders(token.value);
    const endpoint = '/stress/latest';
    
    const response = await firstValueFrom(
      this.http.get<StressData>(`${this.BASE_URL}${endpoint}`, { headers })
    );
    
    if (!response) {
      throw new Error('Failed to fetch stress data');
    }
    
    return response;
  }

  private getHeaders(token: string): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Api-Key': this.config.apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }
} 