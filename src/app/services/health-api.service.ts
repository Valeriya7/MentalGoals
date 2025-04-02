import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@ionic/angular';
import { HealthData } from '../interfaces/health-data.interface';
import { StravaService } from './strava.service';

@Injectable()
export class HealthApiService {
  private healthData = new BehaviorSubject<HealthData | null>(null);
  private connectedDevice = new BehaviorSubject<string | null>(null);
  private readonly BASE_URL = 'https://api.garmin.com';
  private currentDeviceType: 'garmin' | 'samsung' | 'apple' | null = null;

  constructor(
    private http: HttpClient,
    private platform: Platform,
    private stravaService: StravaService
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
      this.currentDeviceType = type;

      // Перевіряємо підключення до Strava
      const isStravaConnected = await this.stravaService.isConnected();
      console.log('Strava connection status:', isStravaConnected);

      if (!isStravaConnected) {
        console.log('Strava is not connected, skipping activity sync');
        this.healthData.next(null);
        return;
      }

      // Отримуємо дані про активності з Strava
      const activities = await this.stravaService.getActivities();
      console.log('Activities fetched:', activities);
      
      if (!activities || activities.length === 0) {
        console.log('No activities found');
        this.healthData.next(null);
        return;
      }

      // Отримуємо останню активність
      const latestActivity = activities[0];
      console.log('Latest Strava activity:', latestActivity);

      // Отримуємо детальну інформацію про активність
      const activityDetails = await this.stravaService.getActivityDetails(latestActivity.id);
      console.log('Activity details:', activityDetails);

      // Отримуємо дані про сон
      const sleepData = await this.stravaService.getSleepData();
      console.log('Sleep data:', sleepData);

      // Отримуємо дані про пульс
      const heartRateData = await this.stravaService.getHeartRateData();
      console.log('Heart rate data:', heartRateData);

      // Отримуємо дані про стрес
      const stressData = await this.stravaService.getStressData();
      console.log('Stress data:', stressData);

      // Формуємо об'єкт з даними про здоров'я
      const healthData: HealthData = {
        deviceType: type,
        lastSync: new Date(),
        sleep: sleepData ? {
          startTime: new Date(sleepData.startTime),
          endTime: new Date(sleepData.endTime),
          duration: sleepData.duration,
          quality: sleepData.quality,
          deepSleep: sleepData.deepSleep,
          remSleep: sleepData.remSleep,
          lightSleep: sleepData.lightSleep,
          awakeTime: sleepData.awakeTime
        } : {
          startTime: new Date(),
          endTime: new Date(),
          duration: 0,
          quality: 0,
          deepSleep: 0,
          remSleep: 0,
          lightSleep: 0,
          awakeTime: 0
        },
        activity: {
          steps: activityDetails?.steps || 0,
          distance: activityDetails?.distance || 0,
          calories: activityDetails?.calories || 0,
          activeMinutes: activityDetails?.moving_time || 0,
          heartRate: {
            current: heartRateData?.current || 0,
            average: heartRateData?.average || 0,
            max: heartRateData?.max || 0,
            min: heartRateData?.min || 0
          }
        },
        stress: {
          level: stressData?.level || 0,
          timestamp: new Date()
        }
      };

      this.healthData.next(healthData);
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