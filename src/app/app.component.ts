import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PlatformCheckService } from 'src/app/services/platform-check.service';
import { VersionCheckService } from './services/version-check.service';
import { TranslateService } from './services/translate.service';
import { TranslatePipe } from './pipes/translate.pipe';
import { addIcons } from 'ionicons';
import { 
  homeOutline, home,
  leafOutline, leaf,
  calendarOutline, calendar,
  personOutline, person,
  addOutline, add,
  notificationsOutline, notifications,
  trophyOutline, trophy,
  moonOutline, moon,
  waterOutline, water,
  footstepsOutline, footsteps,
  bookmarkOutline, bookmark,
  iceCreamOutline, iceCream,
  cafeOutline, cafe,
  fitnessOutline, fitness,
  bookOutline, book,
  checkmark,
  chevronForward,
  watchOutline,
  timeOutline,
  logOutOutline,
  addCircleOutline,
  heartOutline,
  pulseOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, TranslatePipe]
})
export class AppComponent implements OnInit {
  platformType: string = '';

  constructor(
    private platformCheckService: PlatformCheckService,
    private versionCheckService: VersionCheckService,
    private translateService: TranslateService
  ) {
    addIcons({
      'home': home,
      'home-outline': homeOutline,
      'leaf': leaf,
      'leaf-outline': leafOutline,
      'calendar': calendar,
      'calendar-outline': calendarOutline,
      'person': person,
      'person-outline': personOutline,
      'add': add,
      'add-outline': addOutline,
      'notifications': notifications,
      'notifications-outline': notificationsOutline,
      'trophy': trophy,
      'trophy-outline': trophyOutline,
      'moon': moon,
      'moon-outline': moonOutline,
      'water': water,
      'water-outline': waterOutline,
      'footsteps': footsteps,
      'footsteps-outline': footstepsOutline,
      'bookmark': bookmark,
      'bookmark-outline': bookmarkOutline,
      'ice-cream': iceCream,
      'ice-cream-outline': iceCreamOutline,
      'cafe': cafe,
      'cafe-outline': cafeOutline,
      'fitness': fitness,
      'fitness-outline': fitnessOutline,
      'book': book,
      'book-outline': bookOutline,
      'checkmark': checkmark,
      'chevron-forward': chevronForward,
      'watch-outline': watchOutline,
      'time-outline': timeOutline,
      'log-out-outline': logOutOutline,
      'add-circle-outline': addCircleOutline,
      'heart-outline': heartOutline,
      'pulse-outline': pulseOutline,
      'checkmark-circle-outline': checkmarkCircleOutline
    });
  }

  async ngOnInit() {
    try {
      this.platformType = this.platformCheckService.getPlatform();
      console.log('Current platform:', this.platformType);
      this.versionCheckService.checkVersion();
      await this.translateService.loadSavedLanguage();
      console.log('Translations loaded successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }
}
