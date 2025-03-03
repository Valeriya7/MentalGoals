import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@ionic/angular';
import { HealthData } from '../interfaces/health-data.interface';

@Injectable()
export class HealthApiService {
  private healthData = new BehaviorSubject<HealthData | null>(null);
  private connectedDevice = new BehaviorSubject<string | null>(null);
  private readonly BASE_URL = 'https://api.garmin.com';

  constructor(
    private http: HttpClient,
    private platform: Platform
  ) {
    this.initializeConnectedDevice();
  }

  private async initializeConnectedDevice() {
    const { value } = await Preferences.get({ key: 'connected_device' });
    if (value) {
      this.connectedDevice.next(value);
      await this.syncHealthData(value as 'garmin' | 'samsung' | 'apple');
    }
  }

  async connectDevice(type: 'garmin' | 'samsung' | 'apple'): Promise<boolean> {
    try {
      let connected = false;

      switch (type) {
        case 'garmin':
          connected = await this.authorizeGarmin();
          break;
        case 'samsung':
          if (this.platform.is('android')) {
            connected = await this.authorizeSamsung();
          } else {
            throw new Error('Samsung Health is only available on Android devices');
          }
          break;
        case 'apple':
          if (this.platform.is('ios')) {
            connected = await this.authorizeApple();
          } else {
            throw new Error('Apple Health is only available on iOS devices');
          }
          break;
      }

      if (connected) {
        await Preferences.set({ key: 'connected_device', value: type });
        this.connectedDevice.next(type);
        await this.syncHealthData(type);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error connecting to ${type}:`, error);
      return false;
    }
  }

  private async authorizeGarmin(): Promise<boolean> {
    try {
      // Імітація авторизації
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch (error) {
      console.error('Garmin authorization error:', error);
      return false;
    }
  }

  private async authorizeSamsung(): Promise<boolean> {
    try {
      // Імітація авторизації
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch (error) {
      console.error('Samsung Health authorization error:', error);
      return false;
    }
  }

  private async authorizeApple(): Promise<boolean> {
    try {
      // Імітація авторизації
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch (error) {
      console.error('Apple Health authorization error:', error);
      return false;
    }
  }

  async syncHealthData(type: 'garmin' | 'samsung' | 'apple'): Promise<void> {
    try {
      // Імітація отримання даних
      const mockData: HealthData = {
        sleep: {
          duration: 8,
          quality: 85,
          deepSleep: 2.5,
          lightSleep: 4.5,
          remSleep: 1,
          awakeTime: 0.2,
          startTime: new Date(),
          endTime: new Date()
        },
        activity: {
          steps: 10000,
          distance: 7.5,
          calories: 2500,
          activeMinutes: 60,
          heartRate: {
            current: 75,
            min: 60,
            max: 150,
            average: 80
          }
        },
        stress: {
          level: 45,
          timestamp: new Date()
        },
        lastSync: new Date(),
        deviceType: type
      };

      this.healthData.next(mockData);
    } catch (error) {
      console.error('Error syncing health data:', error);
      this.healthData.next(null);
    }
  }

  getHealthData(): Observable<HealthData | null> {
    return this.healthData.asObservable();
  }

  getConnectedDevice(): Observable<string | null> {
    return this.connectedDevice.asObservable();
  }

  async disconnectDevice(): Promise<void> {
    await Preferences.remove({ key: 'connected_device' });
    this.connectedDevice.next(null);
    this.healthData.next(null);
  }
} 