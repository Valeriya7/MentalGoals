import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { StravaService } from '../../services/strava.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-strava-callback',
  template: `
    <ion-content class="ion-padding">
      <div class="loading-container">
        <ion-spinner></ion-spinner>
        <p>{{ 'STRAVA.CONNECTING' | translate }}</p>
      </div>
    </ion-content>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
    ion-spinner {
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
    p {
      margin: 0;
      color: var(--ion-color-medium);
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule]
})
export class StravaCallbackPage implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stravaService: StravaService
  ) {
    console.log('StravaCallbackPage initialized');
  }

  ngOnInit() {
    console.log('StravaCallbackPage ngOnInit');
    
    // Підписуємося на зміни параметрів URL
    this.route.queryParams.subscribe(params => {
      console.log('URL parameters:', params);
      
      // Перевіряємо наявність коду авторизації
      if (params['code']) {
        console.log('Received authorization code:', params['code']);
        this.handleCallback(params['code']);
      } else {
        console.error('No authorization code provided');
        this.router.navigate(['/tabs/profile']);
      }
    });
  }

  private async handleCallback(code: string) {
    try {
      console.log('Starting token exchange process...');
      const success = await this.stravaService.handleCallback(code);
      
      if (success) {
        console.log('Successfully connected to Strava');
      } else {
        console.error('Failed to connect to Strava');
      }
      
      // В будь-якому випадку перенаправляємо на сторінку профілю
      this.router.navigate(['/tabs/profile']);
    } catch (error) {
      console.error('Error handling Strava callback:', error);
      this.router.navigate(['/tabs/profile']);
    }
  }
} 