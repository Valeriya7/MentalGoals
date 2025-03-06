import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular'; // Додаємо модулі Ionic
import { CommonModule } from '@angular/common';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { Router } from '@angular/router';
import { appConfig } from '../../app.config';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true, // Це standalone компонент
  imports: [CommonModule, IonicModule], // Додаємо модулі
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  user: any = null;
  error: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.initGoogleAuth();
  }

  async initGoogleAuth() {
    try {
      this.isLoading = true;
      this.error = '';
      
      const platform = Capacitor.getPlatform();
      const clientId = platform === 'ios' 
        ? '629190984804-oqit9rd3t8rb7jucei1lq8g236c1bpjg.apps.googleusercontent.com'
        : platform === 'android'
          ? '629190984804-hihuo9k8tj6bn2f3pm3b3omgfiqdualp.apps.googleusercontent.com'
          : '629190984804-no655ouoceoo29td33q34f32ek2eanne.apps.googleusercontent.com';

      await GoogleAuth.initialize({
        clientId: clientId,
        scopes: ['profile', 'email'],
        forceCodeForRefreshToken: true
      });
    } catch (error) {
      console.error('Error initializing Google Auth:', error);
      this.error = 'Помилка ініціалізації Google Auth';
    } finally {
      this.isLoading = false;
    }
  }

  async googleLogin() {
    try {
      this.isLoading = true;
      this.error = '';
      
      const user = await this.authService.signIn();
      if (user) {
        await this.router.navigate(['/tabs/home']);
      }
    } catch (error) {
      console.error('Login error:', error);
      this.error = 'Помилка входу через Google. Спробуйте ще раз.';
    } finally {
      this.isLoading = false;
    }
  }
}
