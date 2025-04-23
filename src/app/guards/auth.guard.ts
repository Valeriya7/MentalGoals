import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    try {
      const user = await this.authService.getCurrentUser();
      
      if (user) {
        // Перевіряємо, чи це перший вхід користувача
        const { value: isFirstLogin } = await Preferences.get({ key: 'isFirstLogin' });
        
        if (isFirstLogin === null) {
          // Якщо це перший вхід, встановлюємо прапорець та перенаправляємо на сторінку питань
          await Preferences.set({ key: 'isFirstLogin', value: 'false' });
          this.router.navigate(['/tabs/questions']);
          return false;
        }
        
        return true;
      }

      // Якщо користувач не авторизований і намагається отримати доступ до захищеного маршруту
      if (route.routeConfig?.path !== 'questions') {
        this.router.navigate(['/auth']);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Auth guard error:', error);
      // У випадку помилки перенаправляємо на сторінку авторизації тільки для захищених маршрутів
      if (route.routeConfig?.path !== 'questions') {
        this.router.navigate(['/auth']);
        return false;
      }
      return true;
    }
  }
} 