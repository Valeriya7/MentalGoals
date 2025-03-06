import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    try {
      const user = await this.authService.getCurrentUser();
      
      if (user) {
        return true;
      }

      // Якщо користувач не авторизований, перенаправляємо на сторінку авторизації
      await this.router.navigate(['/auth']);
      return false;
    } catch (error) {
      console.error('Auth guard error:', error);
      // У випадку помилки також перенаправляємо на сторінку авторизації
      await this.router.navigate(['/auth']);
      return false;
    }
  }
} 