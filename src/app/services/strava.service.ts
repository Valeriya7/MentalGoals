import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Platform } from '@ionic/angular';
import { Browser } from '@capacitor/browser';
import { Router } from '@angular/router';
import { StravaActivity, StravaTokenResponse, StravaActivityDetails } from '../interfaces/strava.interface';
import { firstValueFrom } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { Observable } from 'rxjs';

interface StravaToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface StravaSleepData {
  startTime: string;
  endTime: string;
  duration: number;
  quality: number;
  deepSleep: number;
  remSleep: number;
  lightSleep: number;
  awakeTime: number;
}

interface StravaHeartRateData {
  current: number;
  average: number;
  max: number;
  min: number;
}

interface StravaStressData {
  level: number;
}

@Injectable({
  providedIn: 'root'
})
export class StravaService {
  private readonly STRAVA_TOKEN_KEY = 'strava_token';
  private readonly STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
  private readonly STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
  private readonly STRAVA_API_URL = 'https://www.strava.com/api/v3';
  private readonly STRAVA_ATHLETE_KEY = 'strava_athlete';
  private readonly STRAVA_EMAIL_KEY = 'strava_email';
  private readonly clientId: string;
  private readonly clientSecret: string;
  private activities: StravaActivityDetails[] = [];

  constructor(
    private http: HttpClient,
    private platform: Platform,
    private router: Router
  ) {
    this.clientId = environment.strava.clientId;
    this.clientSecret = environment.strava.clientSecret;
    console.log('StravaService initialized with client ID:', this.clientId);
  }

  async connect(): Promise<void> {
    const state = Math.random().toString(36).substring(7);
    const redirectUri = this.getRedirectUri();
    const scope = 'read,activity:read,activity:read_all,profile:read_all';

    const authUrl = `${this.STRAVA_AUTH_URL}?client_id=${this.clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=${scope}&state=${state}`;
    
    console.log('Redirecting to Strava authorization URL:', authUrl);

    if (this.platform.is('capacitor')) {
      await Browser.open({ url: authUrl, windowName: '_self' });
    } else {
      window.location.href = authUrl;
    }
  }

  async handleCallback(code: string): Promise<boolean> {
    try {
      console.log('Handling Strava callback with code:', code);
      const token = await this.exchangeCodeForToken(code);
      
      if (token) {
        console.log('Successfully obtained token');
        return true;
      }
      
      console.error('Failed to obtain token');
      return false;
    } catch (error) {
      console.error('Error handling Strava callback:', error);
      return false;
    }
  }

  private async exchangeCodeForToken(code: string): Promise<boolean> {
    try {
      console.log('Exchanging code for token...');
      const response = await this.http.post<StravaTokenResponse>(this.STRAVA_TOKEN_URL, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        grant_type: 'authorization_code'
      }).toPromise();

      if (response) {
        console.log('Token exchange successful');
        await this.saveToken(response);
        return true;
      }
      
      console.error('No response from token exchange');
      return false;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      return false;
    }
  }

  private async saveToken(tokenData: StravaTokenResponse) {
    console.log('💾 Saving Strava token data');
    const tokenInfo = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: tokenData.expires_at,
      athlete: tokenData.athlete
    };

    try {
      // Зберігаємо в localStorage
      localStorage.setItem(this.STRAVA_TOKEN_KEY, JSON.stringify(tokenInfo));
      console.log('✅ Strava token saved successfully in localStorage');
      
      // Зберігаємо в Preferences
      await Preferences.set({
        key: this.STRAVA_TOKEN_KEY,
        value: JSON.stringify(tokenInfo)
      });
      console.log('✅ Strava token saved successfully in Preferences');
      
      // Verify token was saved
      const savedToken = localStorage.getItem(this.STRAVA_TOKEN_KEY);
      console.log('🔍 Token verification:', {
        saved: !!savedToken,
        length: savedToken?.length
      });
    } catch (error) {
      console.error('❌ Error saving token:', error);
      throw error;
    }
  }

  private async getToken(): Promise<StravaToken | null> {
    try {
      // Спочатку перевіряємо localStorage
      let tokenStr = localStorage.getItem(this.STRAVA_TOKEN_KEY);
      
      // Якщо в localStorage немає, перевіряємо Preferences
      if (!tokenStr) {
        const { value } = await Preferences.get({ key: this.STRAVA_TOKEN_KEY });
        if (value) {
          tokenStr = value;
          // Синхронізуємо з localStorage
          localStorage.setItem(this.STRAVA_TOKEN_KEY, value);
        }
      }

      if (!tokenStr) {
        console.error('No token found');
        return null;
      }

      const token: StravaToken = JSON.parse(tokenStr);
      if (!this.isTokenValid(token)) {
        console.error('Token is invalid or expired');
        return null;
      }

      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  private isTokenValid(token: StravaToken): boolean {
    if (!token || !token.access_token || !token.expires_at) {
      console.error('Invalid token structure');
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const isValid = token.expires_at > currentTime;
    console.log('Token validity check:', { currentTime, expiresAt: token.expires_at, isValid });
    
    return isValid;
  }

  async isConnected(): Promise<boolean> {
    const token = await this.getToken();
    const isConnected = !!token;
    console.log('Strava connection status:', isConnected);
    return isConnected;
  }

  private async refreshToken(token: StravaToken): Promise<StravaToken | null> {
    try {
      console.log('Refreshing Strava token...');
      const response = await this.http.post<StravaTokenResponse>(this.STRAVA_TOKEN_URL, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: token.refresh_token,
        grant_type: 'refresh_token'
      }).toPromise();

      if (response) {
        console.log('Token refresh successful');
        await this.saveToken(response);
        return {
          access_token: response.access_token,
          refresh_token: response.refresh_token,
          expires_at: response.expires_at
        };
      }

      console.error('No response from token refresh');
      return null;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  private async getValidToken(): Promise<StravaToken | null> {
    const token = await this.getToken();
    if (!token) {
      console.error('No token found');
      return null;
    }

    if (this.isTokenValid(token)) {
      return token;
    }

    console.log('Token expired, attempting to refresh...');
    return await this.refreshToken(token);
  }

  async getActivities(): Promise<StravaActivity[]> {
    try {
      console.log('Fetching Strava activities...');
      const token = await this.getValidToken();
      
      if (!token) {
        console.error('No valid token found');
        return [];
      }

      const response = await this.http.get<StravaActivity[]>(
        `${this.STRAVA_API_URL}/athlete/activities`,
        {
          headers: {
            'Authorization': `Bearer ${token.access_token}`
          }
        }
      ).toPromise();

      console.log('Activities fetched:', response);
      return response || [];
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  async getActivityDetails(activityId: number): Promise<StravaActivityDetails | null> {
    try {
      const token = await this.getValidToken();
      if (!token) {
        console.error('No valid token available for fetching activity details');
        return null;
      }

      console.log(`Fetching details for activity ${activityId}...`);
      const response = await this.http.get<StravaActivityDetails>(`${this.STRAVA_API_URL}/activities/${activityId}`, {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${token.access_token}`
        })
      }).toPromise();

      if (response) {
        console.log('Activity details:', response);
        return response;
      }

      return null;
    } catch (error) {
      console.error('Error fetching activity details:', error);
      return null;
    }
  }

  async getSleepData(): Promise<StravaSleepData | null> {
    try {
      const token = await this.getValidToken();
      if (!token) {
        console.error('No valid token available for fetching sleep data');
        return null;
      }

      console.log('Fetching sleep data from Strava...');
      const response = await this.http.get<any>(`${this.STRAVA_API_URL}/athlete/sleep`, {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${token.access_token}`
        })
      }).toPromise();

      if (response && response.length > 0) {
        const latestSleep = response[0];
        return {
          startTime: latestSleep.start_time,
          endTime: latestSleep.end_time,
          duration: latestSleep.duration,
          quality: latestSleep.quality,
          deepSleep: latestSleep.deep_sleep,
          remSleep: latestSleep.rem_sleep,
          lightSleep: latestSleep.light_sleep,
          awakeTime: latestSleep.awake_time
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching sleep data:', error);
      return null;
    }
  }

  async getHeartRateData(): Promise<StravaHeartRateData | null> {
    try {
      const token = await this.getValidToken();
      if (!token) {
        console.error('No valid token available for fetching heart rate data');
        return null;
      }

      console.log('Fetching heart rate data from Strava...');
      const response = await this.http.get<any>(`${this.STRAVA_API_URL}/athlete/heartrate`, {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${token.access_token}`
        })
      }).toPromise();

      if (response && response.length > 0) {
        const latestHR = response[0];
        return {
          current: latestHR.current || 0,
          average: latestHR.average || 0,
          max: latestHR.max || 0,
          min: latestHR.min || 0
        };
      }

      console.log('No heart rate data available');
      return null;
    } catch (error) {
      console.error('Error fetching heart rate data:', error);
      return null;
    }
  }

  async getStressData(): Promise<StravaStressData | null> {
    try {
      const token = await this.getValidToken();
      if (!token) {
        console.error('No valid token available for fetching stress data');
        return null;
      }

      console.log('Fetching stress data from Strava...');
      const response = await this.http.get<any>(`${this.STRAVA_API_URL}/athlete/stress`, {
        headers: { Authorization: `Bearer ${token.access_token}` }
      }).toPromise();

      if (response && response.length > 0) {
        const latestStress = response[0];
        return {
          level: latestStress.level || 0
        };
      }

      console.log('No stress data available');
      return null;
    } catch (error) {
      console.error('Error fetching stress data:', error);
      return null;
    }
  }

  private calculateStressLevel(activity: StravaActivityDetails): number {
    // Розраховуємо рівень стресу на основі:
    // 1. Тривалості тренування
    // 2. Середньої швидкості
    // 3. Підйому
    // 4. Пульсу
    const duration = activity.elapsed_time / 3600; // години
    const speed = activity.average_speed;
    const elevation = activity.total_elevation_gain;
    const heartRate = activity.average_heartrate;

    let stressLevel = 0;

    // Тривалість (максимум 40%)
    stressLevel += Math.min(duration * 10, 40);

    // Швидкість (максимум 30%)
    stressLevel += Math.min(speed * 5, 30);

    // Підйом (максимум 20%)
    stressLevel += Math.min(elevation / 100, 20);

    // Пульс (максимум 10%)
    if (heartRate) {
      const maxHR = 220 - 30; // Приблизна формула
      const hrPercentage = (heartRate / maxHR) * 100;
      stressLevel += Math.min(hrPercentage / 10, 10);
    }

    return Math.min(Math.round(stressLevel), 100);
  }

  async disconnect(): Promise<void> {
    try {
      console.log('Disconnecting from Strava...');
      localStorage.removeItem(this.STRAVA_TOKEN_KEY);
      console.log('Successfully disconnected from Strava');
    } catch (error) {
      console.error('Error disconnecting from Strava:', error);
    }
  }

  private getRedirectUri(): string {
    if (this.platform.is('capacitor')) {
      return environment.strava.redirectUri;
    }
    return window.location.origin + '/strava-callback';
  }

  async getAthleteEmail(): Promise<string | null> {
    try {
      const token = await this.getToken();
      if (!token) {
        console.error('No token available for athlete email request');
        return null;
      }

      console.log('Fetching athlete data with token:', {
        tokenLength: token.access_token.length,
        expiresAt: new Date(token.expires_at * 1000).toISOString()
      });

      // Спочатку перевіряємо збережені дані атлета
      const athleteData = await Preferences.get({ key: this.STRAVA_ATHLETE_KEY });
      if (athleteData.value) {
        const athlete = JSON.parse(athleteData.value);
        console.log('Stored athlete data:', athlete);
        if (athlete.email) {
          console.log('Found athlete email in stored data:', athlete.email);
          return athlete.email;
        }
      }

      // Якщо email немає в збережених даних, отримуємо його через API
      const response = await this.http.get<any>(`${this.STRAVA_API_URL}/athlete`, {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${token.access_token}`
        })
      }).toPromise();

      console.log('Athlete API response:', response);

      if (response) {
        // Перевіряємо різні можливі місця, де може бути email
        const email = response.email || response.athlete?.email || response.user?.email;
        
        if (email) {
          console.log('Found athlete email in API response:', email);
          // Зберігаємо email
          await this.saveAthleteEmail(email);
          return email;
        }
      }

      console.error('No email found in athlete data or stored preferences');
      return null;
    } catch (error) {
      console.error('Error fetching athlete email:', error);
      return null;
    }
  }

  async saveAthleteEmail(email: string) {
    if (!email) {
      console.error('No email provided to save');
      return;
    }
    await Preferences.set({ key: this.STRAVA_EMAIL_KEY, value: email });
    console.log('Athlete email saved:', email);
  }
}