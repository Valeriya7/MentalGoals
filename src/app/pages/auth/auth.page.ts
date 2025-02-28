import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular'; // Додаємо модулі Ionic
import { CommonModule } from '@angular/common';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { Router } from '@angular/router';
import { APP_CONFIG } from '../../../../src/app.config';
@Component({
  selector: 'app-auth',
  standalone: true, // Це standalone компонент
  imports: [CommonModule, IonicModule], // Додаємо модулі
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  user: any = null;

  private googleClientIds = {
    ios: '629190984804-oqit9rd3t8rb7jucei1lq8g236c1bpjg.apps.googleusercontent.com',
    android: '629190984804-hihuo9k8tj6bn2f3pm3b3omgfiqdualp.apps.googleusercontent.com',
    web: '629190984804-no655ouoceoo29td33q34f32ek2eanne.apps.googleusercontent.com'
  };

  constructor(private router: Router) {
  }

  ngOnInit() {
    this.initGoogleAuth();
  }

  async initGoogleAuth() {
    let googleClientIdsPlatform = this.googleClientIds.web;
    if (Capacitor.getPlatform() === 'ios') {
      googleClientIdsPlatform = this.googleClientIds.ios;
    } else if (Capacitor.getPlatform() === 'android') {
      googleClientIdsPlatform = this.googleClientIds.android;
    }
    console.log('this.googleClientIds: ', this.googleClientIds);
    console.log('platform: ', googleClientIdsPlatform);

    GoogleAuth.initialize({
      clientId: googleClientIdsPlatform,
      scopes: ['profile', 'email'],
      forceCodeForRefreshToken: true
    });

  }

  async googleLogin() {
    try {
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

        console.log("name:", name);

        APP_CONFIG.ID_TOKEN = idToken;
        // Збереження даних
        await Preferences.set({key: 'idToken', value: idToken});
        await Preferences.set({key: 'accessToken', value: accessToken});
        await Preferences.set({key: 'email', value: email});
        await Preferences.set({key: 'name', value: name});

        // Якщо вхід успішний, перенаправляємо на головну сторінку
        this.router.navigate(['/home']);

      } else {
        console.error('Google login failed: No token received');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  }
}
