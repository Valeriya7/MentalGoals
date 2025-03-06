import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UtilService } from 'src/app/services/util.service';
import { Preferences } from '@capacitor/preferences';
import { NavigationExtras } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { WishesService } from '../../services/wishes.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { WishModalComponent } from '../../components/wish-modal/wish-modal.component';
import { ChallengeService } from '../../services/challenge.service';
import { Challenge } from '../../interfaces/challenge.interface';
import { ModalService } from '../../services/modal.service';
import { addIcons } from 'ionicons';
import { 
  iceCreamOutline, 
  cafeOutline, 
  fitnessOutline, 
  footstepsOutline, 
  bookOutline,
  notificationsOutline,
  calendarOutline,
  heartOutline,
  personOutline,
  settingsOutline,
  chevronForwardOutline,
  addOutline
} from 'ionicons/icons';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    IonicModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomePage implements OnInit, OnDestroy {
  userName: string = 'Sayli';
  weekDays: any[] = [];
  dailyTasks = [
    { name: 'No Sweets', icon: 'ice-cream-outline', completed: true },
    { name: 'No Coffee', icon: 'cafe-outline', completed: true },
    { name: '10min Exercise', icon: 'fitness-outline', completed: false },
    { name: '8000 Steps', icon: 'footsteps-outline', completed: false },
    { name: '5 English Words', icon: 'book-outline', completed: true }
  ];
  hasUnreadWish = false;
  currentWish = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private util: UtilService,
    private wishesService: WishesService,
    private challengeService: ChallengeService,
    private modalService: ModalService,
    private toastController: ToastController
  ) {
    this.generateWeekDays();
    addIcons({ 
      iceCreamOutline, 
      cafeOutline, 
      fitnessOutline, 
      footstepsOutline, 
      bookOutline,
      notificationsOutline,
      calendarOutline,
      heartOutline,
      personOutline,
      settingsOutline,
      chevronForwardOutline,
      addOutline
    });
  }

  ngOnInit() {
    this.getUserData();
    this.subscriptions.push(
      this.wishesService.getHasUnreadWish().subscribe(hasUnread => {
        this.hasUnreadWish = hasUnread;
      }),
      this.wishesService.getCurrentWish().subscribe(wish => {
        this.currentWish = wish;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  generateWeekDays() {
    const today = new Date();
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      this.weekDays.push({
        name: dayNames[date.getDay()],
        date: date.getDate(),
        marked: i < 0 && Math.random() > 0.5, // Випадково відмічаємо минулі дні
        fullDate: date
      });
    }
  }

  isCurrentDay(date: number): boolean {
    return date === new Date().getDate();
  }

  goToCalendar() {
    this.router.navigate(['/tabs/habits']);
  }

  goToNotifications() {
    this.router.navigate(['/tabs/notifications']);
  }

  goToHabit(type: string) {
    this.router.navigate(['/tabs/habits'], {
      queryParams: { type: type }
    });
  }

  goToLifeWheel() {
    this.router.navigate(['/life-wheel']);
  }

  async getUserData() {
    const name = await Preferences.get({key: 'name'});
    if (name && name.value) {
      this.userName = name.value;
    }
    return name;
  }

  async showWish(): Promise<void> {
    if (this.hasUnreadWish) {
      await this.wishesService.markWishAsRead();
      this.hasUnreadWish = false;
    }

    const modal = await this.modalService.createModal(WishModalComponent, {
      wish: this.currentWish
    }, 'half-modal');

    await modal.present();
  }

  async goToCurrentChallenge() {
    try {
      const activeChallenge = await this.challengeService.getCurrentActiveChallenge();
      console.log('Current active challenge:', activeChallenge);
      
      if (activeChallenge) {
        await this.router.navigate(['/challenge-details', activeChallenge.id]);
      } else {
        const toast = await this.toastController.create({
          message: 'У вас немає активного челенджу',
          duration: 3000,
          position: 'bottom',
          color: 'warning'
        });
        await toast.present();
      }
    } catch (error) {
      console.error('Error navigating to challenge:', error);
      const toast = await this.toastController.create({
        message: 'Сталася помилка. Спробуйте ще раз.',
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }
}
