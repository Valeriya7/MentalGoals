import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { HealthApiService } from '../../services/health-api.service';
import { HealthData } from '../../interfaces/health-data.interface';
import { Subscription } from 'rxjs';
import { HealthApiModule } from '../../services/health-api.module';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '../../services/translate.service';
import { AuthService } from '../../services/auth.service';
import { StravaService } from '../../services/strava.service';
import { ToastController } from '@ionic/angular';
import { PointsService } from '../../services/points.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    IonicModule, 
    CommonModule, 
    FormsModule, 
    HealthApiModule, 
    TranslateModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ProfilePage implements OnInit, OnDestroy {
  userName: string = '';
  userPhotoUrl: string = '';
  totalPoints: number = 0;
  currentLanguage: string = 'en';
  availableLanguages = [
    { code: 'en', name: 'PROFILE.LANGUAGES.EN' },
    { code: 'uk', name: 'PROFILE.LANGUAGES.UK' },
    { code: 'de', name: 'PROFILE.LANGUAGES.DE' }
  ];
  isConnected = {
    garmin: false,
    samsung: false,
    apple: false
  };
  notifications = {
    push: true,
    reminders: true,
    achievements: true
  };

  healthData: HealthData | null = null;
  private healthDataSubscription?: Subscription;

  selectedActivityType: string = 'all';
  selectedPeriod: string = 'week';
  isStravaConnected = false;
  stravaEmail: string | null = null;
  stravaActivities: any[] = [];
  showStravaCredentials = false;
  stravaClientId: string = '';
  stravaClientSecret: string = '';

  userPoints: number = 0;

  constructor(
    private router: Router,
    private healthApiService: HealthApiService,
    private authService: AuthService,
    private translateService: TranslateService,
    private toastController: ToastController,
    private stravaService: StravaService,
    private pointsService: PointsService,
  ) {}

  async ngOnInit() {
    await this.loadUserData();
    this.subscribeToHealthData();
    await this.loadLanguageSettings();
    this.checkStravaConnection();
    this.userPoints = await this.pointsService.getPoints();
    
    this.pointsService.points$.subscribe(points => {
      this.userPoints = points;
    });
  }

  ngOnDestroy() {
    if (this.healthDataSubscription) {
      this.healthDataSubscription.unsubscribe();
    }
  }

  private async loadLanguageSettings() {
    try {
      const { value } = await Preferences.get({ key: 'language' });
      if (value) {
        this.currentLanguage = value;
        await this.translateService.setLanguage(value);
      }
    } catch (error) {
      console.error('Error loading language settings:', error);
    }
  }

  async changeLanguage(event: any) {
    const newLang = event.detail.value;
    try {
      await this.translateService.setLanguage(newLang);
      this.currentLanguage = newLang;
      window.location.reload();
    } catch (error) {
      console.error('Error changing language:', error);
    }
  }

  private subscribeToHealthData() {
    this.healthDataSubscription = this.healthApiService.getHealthData()
      .subscribe(data => {
        this.healthData = data;
        if (data) {
          this.isConnected[data.deviceType] = true;
        }
      });
  }

  async loadUserData() {
    const name = await Preferences.get({ key: 'name' });
    const points = await Preferences.get({ key: 'points' });
    const notif = await Preferences.get({ key: 'notifications' });
    const photoURL = await Preferences.get({key:'photoURL'});
    console.log('photoURL: ',photoURL);

    if (name && name.value) this.userName = name.value;
    if (photoURL && photoURL.value) this.userPhotoUrl=photoURL.value;
    if (points && points.value) this.totalPoints = parseInt(points.value);
    if (notif && notif.value) this.notifications = JSON.parse(notif.value);
  }

  async connectDevice(type: 'garmin' | 'samsung' | 'apple') {
    const connected = await this.healthApiService.connectDevice(type);
    if (connected) {
      this.isConnected[type] = true;
      await Preferences.set({
        key: 'connected_devices',
        value: JSON.stringify(this.isConnected)
      });
    }
  }

  async editProfile() {
    this.router.navigate(['/edit-profile']);
  }

  async logout() {
    try {
      await this.healthApiService.disconnectDevice();
      await this.authService.signOut();
      await this.router.navigate(['/auth'], { replaceUrl: true });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  private async checkStravaConnection() {
    this.isStravaConnected = await this.stravaService.isConnected();
    if (this.isStravaConnected) {
      this.stravaEmail = await this.stravaService.getAthleteEmail();
      this.stravaActivities = await this.stravaService.getActivities();
    }
    console.log('Strava connection status:', this.isStravaConnected);
  }

  async connectStrava() {
    try {
      if (!this.stravaClientId || !this.stravaClientSecret) {
        this.showStravaCredentials = true;
        return;
      }

      await this.stravaService.connect();
      await this.checkStravaConnection();
      this.presentToast('Strava успішно підключено!');
    } catch (error) {
      console.error('Error connecting to Strava:', error);
      this.presentToast('Помилка підключення до Strava');
    }
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }

  toggleStravaCredentials() {
    this.showStravaCredentials = !this.showStravaCredentials;
    if (!this.showStravaCredentials) {
      this.stravaClientId = '';
      this.stravaClientSecret = '';
    }
  }
}
