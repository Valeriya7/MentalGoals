import { Injectable } from '@angular/core';
import { Wish } from '../models/wish.model';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class WishService {
  private readonly STORAGE_KEY = 'wishes';

  async getWishes(): Promise<Wish[]> {
    const { value } = await Preferences.get({ key: this.STORAGE_KEY });
    return value ? JSON.parse(value) : [];
  }

  async addWish(wish: Wish): Promise<void> {
    const wishes = await this.getWishes();
    wishes.push(wish);
    await Preferences.set({ key: this.STORAGE_KEY, value: JSON.stringify(wishes) });
  }

  async updateWish(wish: Wish): Promise<void> {
    const wishes = await this.getWishes();
    const index = wishes.findIndex(w => w.id === wish.id);
    if (index !== -1) {
      wishes[index] = wish;
      await Preferences.set({ key: this.STORAGE_KEY, value: JSON.stringify(wishes) });
    }
  }

  async deleteWish(id: string): Promise<void> {
    const wishes = await this.getWishes();
    const filtered = wishes.filter(w => w.id !== id);
    await Preferences.set({ key: this.STORAGE_KEY, value: JSON.stringify(filtered) });
  }
} 