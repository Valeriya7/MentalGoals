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
    private authService: AuthService
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
      console.log('accessToken:', this.user.authentication.accessToken);
      console.log('idToken:', this.user.authentication.idToken);
      /*
      User Info:
      authentication :{
           accessToken: 'ya29.a0AXeO80TPZUU3Cv_hcs99F8ApIF6knRGBmHXNMhIMcct…IgaCgYKATUSARASFQHGX2MiSJ6LTl36G_cTBGRxJv6QAQ0175',
           idToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjVkMTJhYjc4MmNiNjA5Nj…wAR1732USNpIbV88-buqYdaU6uF9OCnqmzbgStDfoNgb8HmVw',
           refreshToken: ''}
      email : "lebedevavaleriya@gmail.com"
      familyName :"M"
      givenName : "Valeriya"
      id : "100064947706655698581"
      imageUrl : "https://lh3.googleusercontent.com/a/ACg8ocJUXfk1spYk2YmA2cwR2U_XlDCmdPj2bXE6mVJ-aFn81yoNZrJk=s96-c"
      name : "Valeriya M"
      serverAuthCode : undefined
       */
      // Перевірка на наявність необхідних даних
      if (this.user && this.user.authentication.idToken) {
        console.log("idToken:", this.user.authentication.idToken);
        console.log("accessToken:", this.user.authentication.accessToken);

        // Відправляємо idToken на бекенд для логіну
        /*
        await fetch("https://your-backend.com/auth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ this.user.idToken })
        });*/

        const idToken = this.user.authentication.idToken;
        const accessToken = this.user.authentication.accessToken;
        const email = this.user.email;
        const name = this.user.name;
        const photoURL = this.user.imageUrl;
        
        console.log('this.user: ',this.user);

        // Оновлюємо токен в конфігурації
        appConfig.ID_TOKEN = idToken;

        // Зберігаємо дані
        await Preferences.set({key: 'idToken', value: idToken});
        await Preferences.set({key: 'accessToken', value: accessToken});
        await Preferences.set({key: 'email', value: email});
        await Preferences.set({key: 'name', value: name});
        await Preferences.set({key: 'photoURL', value: photoURL});

        // Оновлюємо стан автентифікації
        await this.authService.handleSuccessfulLogin(this.user);

        // Перенаправляємо на головну сторінку
        await this.router.navigate(['/tabs/home']);
      } else {
        this.error = 'Помилка входу через Google: токен не отримано';
      }
    } catch (error) {
      console.error('Login error:', error);
      this.error = 'Помилка входу через Google. Спробуйте ще раз.';
    } finally {
      this.isLoading = false;
    }
  }
}
