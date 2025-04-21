import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PointsService {
  private pointsSubject = new BehaviorSubject<number>(0);
  public points$ = this.pointsSubject.asObservable();

  constructor() {
    this.loadPoints();
  }

  private async loadPoints() {
    try {
      const { value } = await Preferences.get({ key: 'userPoints' });
      const points = value ? parseInt(value) : 0;
      this.pointsSubject.next(points);
    } catch (error) {
      console.error('Error loading points:', error);
      this.pointsSubject.next(0);
    }
  }

  async addPoints(amount: number): Promise<void> {
    try {
      const currentPoints = this.pointsSubject.value;
      const newPoints = currentPoints + amount;
      
      await Preferences.set({ key: 'userPoints', value: newPoints.toString() });
      this.pointsSubject.next(newPoints);
    } catch (error) {
      console.error('Error adding points:', error);
    }
  }

  async getPoints(): Promise<number> {
    try {
      const { value } = await Preferences.get({ key: 'userPoints' });
      return value ? parseInt(value) : 0;
    } catch (error) {
      console.error('Error getting points:', error);
      return 0;
    }
  }
} 