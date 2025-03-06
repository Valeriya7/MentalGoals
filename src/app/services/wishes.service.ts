import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class WishesService {
  private hasUnreadWish = new BehaviorSubject<boolean>(false);
  private currentWish = new BehaviorSubject<string>('');
  private wishes: string[] = [
    'WISHES.MORNING_PRODUCTIVITY',
    'WISHES.YEARLY_PLAN',
    'WISHES.SELF_CARE',
    'WISHES.MINDFULNESS',
    'WISHES.HEALTHY_HABITS',
    'WISHES.GRATITUDE',
    'WISHES.POSITIVE_THINKING',
    'WISHES.GOAL_SETTING'
  ];

  constructor(private translateService: TranslateService) {
    this.loadWishState();
    this.generateNewWish();
  }

  private async loadWishState() {
    const { value } = await Preferences.get({ key: 'hasUnreadWish' });
    this.hasUnreadWish.next(value === 'true');
  }

  private async saveWishState() {
    await Preferences.set({
      key: 'hasUnreadWish',
      value: this.hasUnreadWish.getValue().toString()
    });
  }

  private generateNewWish() {
    const randomIndex = Math.floor(Math.random() * this.wishes.length);
    const wishKey = this.wishes[randomIndex];
    const translatedWish = this.translateService.instant(wishKey);
    this.currentWish.next(translatedWish);
    this.hasUnreadWish.next(true);
    this.saveWishState();
  }

  getHasUnreadWish(): Observable<boolean> {
    return this.hasUnreadWish.asObservable();
  }

  getCurrentWish(): Observable<string> {
    return this.currentWish.asObservable();
  }

  async markWishAsRead() {
    this.hasUnreadWish.next(false);
    await this.saveWishState();
  }
} 