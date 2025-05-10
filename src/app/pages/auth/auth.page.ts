import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseService } from '../../services/firebase.service';
import { ToastController } from '@ionic/angular';
import { getGoogleConfig } from '../../config/firebase.config';

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

  constructor(
    private router: Router,
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    // Ініціалізація Google Auth тепер відбувається в AuthService
  }

  async googleLogin() {
    try {
      this.isLoading = true;
      this.error = '';

      console.log('Starting Google login...');
      console.log('Platform:', Capacitor.getPlatform());

      if (Capacitor.isNativePlatform()) {
        try {
          console.log('Initializing Google Auth...');
          const googleConfig = getGoogleConfig();
          console.log('Google Config:', googleConfig);
          
          await GoogleAuth.initialize({
            clientId: googleConfig.clientId,
            scopes: ['profile', 'email'],
            grantOfflineAccess: true,
            forceCodeForRefreshToken: true
          });
          console.log('Google Auth initialized successfully');

          // Додаємо затримку перед викликом signIn
          await new Promise(resolve => setTimeout(resolve, 1000));

          console.log('Starting Google sign in...');
          const user = await GoogleAuth.signIn();
          console.log('Google Auth Response:', JSON.stringify(user, null, 2));

          if (!user || !user.authentication || !user.authentication.idToken) {
            console.error('Invalid user data:', user);
            throw new Error('Не вдалося отримати токен автентифікації');
          }

          console.log('Token received, proceeding with login...');
          await this.authService.handleSuccessfulLogin(user);
        } catch (googleError: any) {
          console.error('Google Auth error:', googleError);
          if (googleError instanceof Error) {
            console.error('Error details:', {
              name: googleError.name,
              message: googleError.message,
              stack: googleError.stack
            });
          }
          throw new Error(googleError.message || 'Помилка авторизації через Google');
        }
      } else {
        // Для веб-версії використовуємо Firebase Auth
        await this.authService.signInWithGoogle();
      }

      console.log('Login successful, navigating to home...');
      this.router.navigate(['/tabs/home']);
    } catch (error: any) {
      console.error('Login error details:', error);
      this.error = error.message || 'Помилка входу через Google. Спробуйте ще раз.';
      
      // Показуємо повідомлення про помилку
      const toast = await this.toastController.create({
        message: this.error,
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.isLoading = false;
    }
  }
}
