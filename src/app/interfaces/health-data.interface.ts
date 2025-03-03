export interface SleepData {
  startTime: Date;
  endTime: Date;
  duration: number; // в хвилинах
  quality: number; // від 0 до 100
  deepSleep: number; // в хвилинах
  lightSleep: number; // в хвилинах
  remSleep: number; // в хвилинах
  awakeTime: number; // в хвилинах
}

export interface ActivityData {
  steps: number;
  distance: number; // в метрах
  calories: number;
  activeMinutes: number;
  heartRate: {
    current: number;
    min: number;
    max: number;
    average: number;
  };
}

export interface StressData {
  level: number; // від 0 до 100
  timestamp: Date;
}

export interface HealthData {
  sleep: SleepData;
  activity: ActivityData;
  stress: StressData;
  lastSync: Date;
  deviceType: 'garmin' | 'samsung' | 'apple';
} 