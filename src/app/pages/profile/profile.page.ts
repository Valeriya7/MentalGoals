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
  totalPoints: number = 0;
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

  constructor(
    private router: Router,
    private healthApiService: HealthApiService
  ) {}

  async ngOnInit() {
    await this.loadUserData();
    this.subscribeToHealthData();
  }

  ngOnDestroy() {
    if (this.healthDataSubscription) {
      this.healthDataSubscription.unsubscribe();
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

    if (name && name.value) this.userName = name.value;
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
    await this.healthApiService.disconnectDevice();
    await Preferences.clear();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
