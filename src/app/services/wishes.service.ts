import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, firstValueFrom } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { TranslateService } from './translate.service';

@Injectable({
  providedIn: 'root'
})
export class WishesService {
  private wishKeys = [
    'WISHES.MORNING_PRODUCTIVITY',
    'WISHES.YEARLY_PLAN',
    'WISHES.SELF_CARE',
    'WISHES.MINDFULNESS',
    'WISHES.HEALTHY_HABITS',
    'WISHES.GRATITUDE',
    'WISHES.POSITIVE_THINKING',
    'WISHES.GOAL_SETTING'
  ];
  private hasUnreadWish = new BehaviorSubject<boolean>(false);
  private currentWish = new BehaviorSubject<string>('');

  constructor(
    private translateService: TranslateService
  ) {
    this.checkAndUpdateWish();
  }

  private async checkAndUpdateWish() {
    const lastWishDate = await Preferences.get({ key: 'lastWishDate' });
    const today = new Date().toDateString();
    
    if (lastWishDate.value !== today) {
      await this.updateDailyWish();
    } else {
      const currentWish = await Preferences.get({ key: 'currentWish' });
      if (currentWish.value) {
        this.currentWish.next(currentWish.value);
        this.hasUnreadWish.next(true);
      }
    }
  }

  private async updateDailyWish() {
    const randomIndex = Math.floor(Math.random() * this.wishKeys.length);
    const wishKey = this.wishKeys[randomIndex];
    const translatedWish = this.translateService.translate(wishKey);
    
    await Preferences.set({ key: 'currentWish', value: translatedWish });
    await Preferences.set({ key: 'lastWishDate', value: new Date().toDateString() });
    
    this.currentWish.next(translatedWish);
    this.hasUnreadWish.next(true);
  }

  async markWishAsRead() {
    await Preferences.set({ key: 'currentWish', value: '' });
    this.hasUnreadWish.next(false);
  }

  getHasUnreadWish(): Observable<boolean> {
    return this.hasUnreadWish.asObservable();
  }

  getCurrentWish(): Observable<string> {
    return this.currentWish.asObservable();
  }
} 