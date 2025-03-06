import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { Router } from '@angular/router';
import { TokenService } from './token.service';

type Platform = 'ios' | 'android' | 'web';

export interface User {
  displayName?: string;
  email?: string;
  photoURL?: string;
  idToken?: string;
  name?: string;
  imageUrl?: string;
  authentication?: {
    idToken: string;
    accessToken: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  private googleClientIds: Record<Platform, string> = {
    ios: '629190984804-oqit9rd3t8rb7jucei1lq8g236c1bpjg.apps.googleusercontent.com',
    android: '629190984804-hihuo9k8tj6bn2f3pm3b3omgfiqdualp.apps.googleusercontent.com',
    web: '629190984804-no655ouoceoo29td33q34f32ek2eanne.apps.googleusercontent.com'
  };

  constructor(
    private router: Router,
    private tokenService: TokenService
  ) {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const platform = Capacitor.getPlatform() as Platform;
      const clientId = this.googleClientIds[platform] || this.googleClientIds.web;

      // Ініціалізуємо Google Auth
      await GoogleAuth.initialize({
        clientId: clientId,
        scopes: ['profile', 'email'],
        forceCodeForRefreshToken: true,
        serverClientId: clientId
      });

      // Перевіряємо, чи користувач вже авторизований
      try {
        const user = await GoogleAuth.refresh();
        if (user) {
          await this.handleSuccessfulLogin(user);
        }
      } catch (e) {
        // Ігноруємо помилку, якщо користувач не авторизований
      }
    } catch (error) {
      console.error('Error initializing Google Auth:', error);
    }
  }

  async signIn(): Promise<User> {
    try {
      const user = await GoogleAuth.signIn();
      await this.handleSuccessfulLogin(user);
      return user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await GoogleAuth.signOut();
      await this.clearUserData();
      this.currentUserSubject.next(null);
      await this.router.navigate(['/auth']);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const user = await GoogleAuth.refresh();
      if (user) {
        await this.handleSuccessfulLogin(user);
        return user;
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async handleGoogleSignIn(userData: User): Promise<void> {
    try {
      await this.handleSuccessfulLogin(userData);
    } catch (error) {
      console.error('Handle Google Sign-In error:', error);
      throw error;
    }
  }

  private async handleSuccessfulLogin(user: User) {
    if (user && user.authentication?.idToken) {
      const { idToken, accessToken } = user.authentication;
      const { email, name, imageUrl } = user;

      // Зберігаємо дані
      await Promise.all([
        Preferences.set({ key: 'idToken', value: idToken }),
        Preferences.set({ key: 'accessToken', value: accessToken }),
        Preferences.set({ key: 'email', value: email || '' }),
        Preferences.set({ key: 'name', value: name || '' }),
        Preferences.set({ key: 'imageUrl', value: imageUrl || '' })
      ]);

      // Оновлюємо токен
      this.tokenService.idToken = idToken;

      // Оновлюємо стан користувача
      this.currentUserSubject.next({
        ...user,
        photoURL: imageUrl || user.photoURL
      });
    }
  }

  private async clearUserData(): Promise<void> {
    await Promise.all([
      Preferences.remove({ key: 'idToken' }),
      Preferences.remove({ key: 'accessToken' }),
      Preferences.remove({ key: 'email' }),
      Preferences.remove({ key: 'name' }),
      Preferences.remove({ key: 'imageUrl' })
    ]);
    this.tokenService.clearToken();
  }
}
