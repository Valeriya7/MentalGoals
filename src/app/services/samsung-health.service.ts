import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { from, Observable, firstValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Preferences } from '@capacitor/preferences';
import { SamsungHealthConfig } from '../interfaces/api-config.interface';
import { HealthData, SleepData, ActivityData, StressData } from '../interfaces/health-data.interface';

@Injectable({
  providedIn: 'root'
})
export class SamsungHealthService {
  private readonly BASE_URL = 'https://shealth.samsung.com/api';
  private config: SamsungHealthConfig = {
    clientId: 'YOUR_CLIENT_ID',
    clientSecret: 'YOUR_CLIENT_SECRET',
    packageName: 'com.yourapp.package'
  };

  constructor(private http: HttpClient) {}

  async authorize(): Promise<boolean> {
    try {
      // Перевіряємо чи встановлений Samsung Health
      if (!await this.checkSHealthAvailable()) {
        throw new Error('Samsung Health is not installed');
      }

      // Запитуємо дозволи
      const permissions = await this.requestPermissions();
      if (permissions) {
        const token = await this.getAccessToken();
        await Preferences.set({ key: 'samsung_token', value: token });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Samsung Health authorization error:', error);
      return false;
    }
  }

  private async checkSHealthAvailable(): Promise<boolean> {
    // Тут буде перевірка наявності Samsung Health
    return true;
  }

  private async requestPermissions(): Promise<boolean> {
    // Запит на дозволи для читання даних
    const requiredPermissions = [
      'com.samsung.health.sleep',
      'com.samsung.health.step_count',
      'com.samsung.health.heart_rate',
      'com.samsung.health.stress'
    ];

    // Імітація запиту дозволів
    return new Promise((resolve) => setTimeout(() => resolve(true), 1000));
  }

  private async getAccessToken(): Promise<string> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const body = {
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      package_name: this.config.packageName
    };

    // Імітація отримання токену
    return new Promise((resolve) => setTimeout(() => resolve('mock_token'), 1000));
  }

  async getSleepData(date: Date): Promise<SleepData> {
    const token = await Preferences.get({ key: 'samsung_token' });
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
    const token = await Preferences.get({ key: 'samsung_token' });
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
    const token = await Preferences.get({ key: 'samsung_token' });
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
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }
} 