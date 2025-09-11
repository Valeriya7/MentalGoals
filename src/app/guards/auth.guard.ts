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
      console.log('=== AuthGuard: canActivate START ===');
      console.log('Auth guard - Checking authentication...');
      console.log('Route path:', route.routeConfig?.path);
      
      const user = await this.authService.getCurrentUser();
      console.log('Auth guard - Current user:', user);
      
      if (user) {
        // Перевіряємо, чи це перший вхід користувача
        const { value: isFirstLogin } = await Preferences.get({ key: 'isFirstLogin' });
        console.log('Auth guard - Is first login:', isFirstLogin);
        
        if (isFirstLogin === 'true' || isFirstLogin === null) {
          // Якщо це перший вхід і ми не на сторінці питань, перенаправляємо туди
          if (route.routeConfig?.path !== 'questions') {
            console.log('Auth guard - First login detected, redirecting to questions page');
            await this.router.navigate(['/questions'], { replaceUrl: true });
            console.log('=== AuthGuard: canActivate END (redirected to questions) ===');
            return false;
          }
        }
        
        console.log('Auth guard - User is authenticated');
        console.log('=== AuthGuard: canActivate END (user authenticated) ===');
        return true;
      }

      // Якщо користувач не авторизований і намагається отримати доступ до захищеного маршруту
      if (route.routeConfig?.path !== 'questions') {
        console.log('Auth guard - User is not authenticated, redirecting to auth page');
        await this.router.navigate(['/auth'], { replaceUrl: true });
        console.log('=== AuthGuard: canActivate END (redirected to auth) ===');
        return false;
      }

      console.log('=== AuthGuard: canActivate END (questions page allowed) ===');
      return true;
    } catch (error) {
      console.error('Auth guard error:', error);
      // У випадку помилки перенаправляємо на сторінку авторизації тільки для захищених маршрутів
      if (route.routeConfig?.path !== 'questions') {
        console.log('Auth guard - Error occurred, redirecting to auth page');
        await this.router.navigate(['/auth'], { replaceUrl: true });
        console.log('=== AuthGuard: canActivate END (error, redirected to auth) ===');
        return false;
      }
      console.log('=== AuthGuard: canActivate END (error, questions page allowed) ===');
      return true;
    }
  }
} 