import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
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
    TranslateModule,
    RouterModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ProfilePage implements OnInit, OnDestroy {
  userName: string = '';
  userPhotoUrl: string | null = null;
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
  private subscriptions: Subscription[] = [];

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
    this.subscribeToLanguageChanges();
    await this.loadLanguageSettings();
    this.checkStravaConnection();
    this.userPoints = await this.pointsService.getPoints();

    // Підписуємося на зміни користувача для синхронізації фото
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => {
        if (user) {
          this.userName = user.name || this.translateService.instant('COMMON.USER');
          this.userPhotoUrl = user.photoURL || null;
          console.log('ProfilePage - User data updated:', {
            name: this.userName,
            photoURL: this.userPhotoUrl
          });
        }
      })
    );

    this.pointsService.points$.subscribe(points => {
      this.userPoints = points;
    });
  }

  ngOnDestroy() {
    if (this.healthDataSubscription) {
      this.healthDataSubscription.unsubscribe();
    }
    // Очищуємо всі підписки
    this.subscriptions.forEach(sub => sub.unsubscribe());
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
      console.log('Changing language to:', newLang);
      await this.translateService.setLanguage(newLang);
      this.currentLanguage = newLang;
      
      // Оновлюємо дані челенджів та звичок з новою мовою
      await this.refreshDataForNewLanguage();
      
      console.log('Language changed successfully to:', newLang);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  }

  private async refreshDataForNewLanguage() {
    try {
      // Оновлюємо кеш версії для челенджів та звичок
      // Це змусить їх перезавантажити дані з новою мовою
      await Preferences.set({ key: 'challenges_cache_version', value: '2.1' });
      await Preferences.set({ key: 'habits_cache_version', value: '2.1' });
      
      console.log('Data cache versions updated for new language');
    } catch (error) {
      console.error('Error refreshing data for new language:', error);
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

  private subscribeToLanguageChanges() {
    this.translateService.getCurrentLang().subscribe(lang => {
      this.currentLanguage = lang;
      console.log('Profile page - Language changed to:', lang);
    });
  }

  async loadUserData() {
    const name = await Preferences.get({ key: 'name' });
    const points = await Preferences.get({ key: 'points' });
    const notif = await Preferences.get({ key: 'notifications' });
    const photoURL = await Preferences.get({key:'photoURL'});
    console.log('ProfilePage - loadUserData photoURL: ',photoURL);

    // Завантажуємо тільки ті дані, які не синхронізуються з Firebase
    if (name && name.value) this.userName = name.value;
    // Не перезаписуємо userPhotoUrl - він буде завантажений з Firebase
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
    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        console.log('Navigating to edit profile...');
        await this.router.navigate(['/tabs/edit-profile']);
      } else {
        console.log('User not authenticated, redirecting to auth...');
        await this.router.navigate(['/auth']);
      }
    } catch (error) {
      console.error('Error navigating to edit profile:', error);
      await this.presentToast('Помилка навігації до сторінки редагування профілю');
    }
  }

  async logout() {
    try {
      await this.healthApiService.disconnectDevice();
      await this.authService.signOut();
      await this.router.navigateByUrl('/auth');
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

  async goToElasticsearchTest() {
    await this.router.navigate(['/elasticsearch-test']);
  }
}
