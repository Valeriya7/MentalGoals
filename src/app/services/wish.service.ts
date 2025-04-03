import { Injectable } from '@angular/core';
import { Wish, DailyWish } from '../interfaces/wish.interface';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class WishService {
  private readonly WISHES_KEY = 'daily_wishes';
  private readonly CURRENT_WISH_KEY = 'current_wish';
  private wishes: Wish[] = [
    { id: 1, uk: 'Сьогодні – твоя нова можливість. Використай її!', en: 'Today is your new opportunity. Use it!', de: 'Heute ist deine neue Chance. Nutze sie!' },
    { id: 2, uk: 'Маленькі кроки ведуть до великих змін.', en: 'Small steps lead to big changes.', de: 'Kleine Schritte führen zu großen Veränderungen.' },
    // ... додайте всі інші побажання тут
  ];

  constructor() {
    this.initializeWishes();
  }

  private async initializeWishes() {
    try {
      const storedWishes = await Preferences.get({ key: this.WISHES_KEY });
      if (!storedWishes.value) {
        await Preferences.set({
          key: this.WISHES_KEY,
          value: JSON.stringify(this.wishes)
        });
      }
    } catch (error) {
      console.error('Error initializing wishes:', error);
    }
  }

  async getDailyWish(): Promise<Wish> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const storedWish = await Preferences.get({ key: this.CURRENT_WISH_KEY });
      
      if (storedWish.value) {
        const dailyWish: DailyWish = JSON.parse(storedWish.value);
        if (dailyWish.date === today) {
          return dailyWish.wish;
        }
      }

      // Якщо немає збереженого побажання на сьогодні, вибираємо нове
      const randomIndex = Math.floor(Math.random() * this.wishes.length);
      const newWish = this.wishes[randomIndex];
      
      await Preferences.set({
        key: this.CURRENT_WISH_KEY,
        value: JSON.stringify({
          date: today,
          wish: newWish
        })
      });

      return newWish;
    } catch (error) {
      console.error('Error getting daily wish:', error);
      return this.wishes[0]; // Повертаємо перше побажання у випадку помилки
    }
  }
} 