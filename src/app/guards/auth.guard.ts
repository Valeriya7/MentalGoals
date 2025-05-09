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
      console.log('Auth guard - Checking authentication...');
      const user = await this.authService.getCurrentUser();
      console.log('Auth guard - Current user:', user);
      
      if (user) {
        // Перевіряємо, чи це перший вхід користувача
        const { value: isFirstLogin } = await Preferences.get({ key: 'isFirstLogin' });
        console.log('Auth guard - Is first login:', isFirstLogin);
        
        if (isFirstLogin === null) {
          // Якщо це перший вхід, встановлюємо прапорець та перенаправляємо на сторінку питань
          await Preferences.set({ key: 'isFirstLogin', value: 'false' });
          console.log('Auth guard - Redirecting to questions page');
          await this.router.navigate(['/tabs/questions'], { replaceUrl: true });
          return false;
        }
        
        console.log('Auth guard - User is authenticated');
        return true;
      }

      // Якщо користувач не авторизований і намагається отримати доступ до захищеного маршруту
      if (route.routeConfig?.path !== 'questions') {
        console.log('Auth guard - User is not authenticated, redirecting to auth page');
        await this.router.navigate(['/auth'], { replaceUrl: true });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Auth guard error:', error);
      // У випадку помилки перенаправляємо на сторінку авторизації тільки для захищених маршрутів
      if (route.routeConfig?.path !== 'questions') {
        console.log('Auth guard - Error occurred, redirecting to auth page');
        await this.router.navigate(['/auth'], { replaceUrl: true });
        return false;
      }
      return true;
    }
  }
} 