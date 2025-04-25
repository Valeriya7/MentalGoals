import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Preferences } from '@capacitor/preferences';
import { appConfig } from '../../config/app.config';
import { Capacitor } from '@capacitor/core';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  user: any = null;
  isLoading = false;
  error = '';

  private googleClientIds = {
    ios: '629190984804-oqit9rd3t8rb7jucei1lq8g236c1bpjg.apps.googleusercontent.com',
    android: '629190984804-hihuo9k8tj6bn2f3pm3b3omgfiqdualp.apps.googleusercontent.com',
    web: '629190984804-no655ouoceoo29td33q34f32ek2eanne.apps.googleusercontent.com'
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit() {
    this.initGoogleAuth();
  }

  async initGoogleAuth() {
    try {
      this.isLoading = true;
      this.error = '';

      let googleClientIdsPlatform = this.googleClientIds.web;
      if (Capacitor.getPlatform() === 'ios') {
        googleClientIdsPlatform = this.googleClientIds.ios;
      } else if (Capacitor.getPlatform() === 'android') {
        googleClientIdsPlatform = this.googleClientIds.android;
      }

      await GoogleAuth.initialize({
        clientId: googleClientIdsPlatform,
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

      this.user = await GoogleAuth.signIn();
      console.log('User Info:', this.user);

      if (!this.user || !this.user.authentication || !this.user.authentication.idToken) {
        throw new Error('Не вдалося отримати токен автентифікації');
      }

      await this.authService.handleSuccessfulLogin(this.user);
      this.router.navigate(['/tabs/home']);
    } catch (error) {
      console.error('Login error:', error);
      this.error = 'Помилка входу через Google. Спробуйте ще раз.';
    } finally {
      this.isLoading = false;
    }
  }
}
