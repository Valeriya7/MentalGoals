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
import { Challenge, ChallengePhase, ChallengeTask } from '../../interfaces/challenge.interface';
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
  addOutline,
  chevronBackOutline,
  checkmarkCircleOutline,
  personCircleOutline
} from 'ionicons/icons';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';
import { WishService } from '../../services/wish.service';
import { Wish } from '../../models/wish.model';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { uk } from 'date-fns/locale';

interface DiaryEntry {
  date: Date;
  mood: number;
  sleep: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslateModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomePage implements OnInit, OnDestroy {
  userName: string = '';
  userPhotoUrl: string | null = null;
  weekDays: any[] = [];
  selectedDate: Date = new Date();
  currentWeekLabel: string = '';
  activeChallenge: Challenge | null = null;
  challengeDay: number = 0;
  
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
    private toastController: ToastController,
    private authService: AuthService
  ) {
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
      addOutline,
      chevronBackOutline,
      checkmarkCircleOutline,
      personCircleOutline
    });
  }

  async ngOnInit() {
    await this.getUserData();
    this.subscriptions.push(
      this.wishesService.getHasUnreadWish().subscribe(hasUnread => {
        this.hasUnreadWish = hasUnread;
      }),
      this.wishesService.getCurrentWish().subscribe(wish => {
        this.currentWish = wish;
      }),
      this.authService.currentUser$.subscribe(user => {
        if (user) {
          console.log('!! user: ', user);
          this.userName = user.name || 'Користувач';
          this.userPhotoUrl = user.photoURL || null;
        }
      })
    );

    await this.loadActiveChallenge();
    this.generateWeekDays();
    await this.loadSelectedDayProgress();

    // Перевіряємо, чи користувач авторизований
    this.checkAuth();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async loadActiveChallenge() {
    try {
      const activeChallenge = await firstValueFrom(this.challengeService.getActiveChallenge());
      this.activeChallenge = activeChallenge;
      if (this.activeChallenge) {
        const startDate = new Date(this.activeChallenge.startDate);
        const today = new Date();
        this.challengeDay = Math.min(
          Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
          40
        );
      }
    } catch (error) {
      console.error('Error loading active challenge:', error);
    }
  }

  generateWeekDays() {
    const startDate = new Date(this.selectedDate);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const dayNames = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    this.weekDays = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      this.weekDays.push({
        name: dayNames[date.getDay()],
        date: date.getDate(),
        fullDate: date,
        hasCompletedTasks: false
      });
    }

    this.updateWeekLabel();
  }

  updateWeekLabel() {
    const firstDay = this.weekDays[0].fullDate;
    const lastDay = this.weekDays[6].fullDate;
    this.currentWeekLabel = `${firstDay.getDate()} - ${lastDay.getDate()} ${lastDay.toLocaleString('uk-UA', { month: 'long' })}`;
  }

  previousWeek() {
    this.selectedDate.setDate(this.selectedDate.getDate() - 7);
    this.generateWeekDays();
    this.loadSelectedDayProgress();
  }

  nextWeek() {
    this.selectedDate.setDate(this.selectedDate.getDate() + 7);
    this.generateWeekDays();
    this.loadSelectedDayProgress();
  }

  async selectDay(day: any) {
    this.selectedDate = new Date(day.fullDate);
    await this.loadSelectedDayProgress();
  }

  async loadSelectedDayProgress() {
    if (this.activeChallenge) {
      // Оновлюємо статус виконаних завдань для всіх днів тижня
      for (const day of this.weekDays) {
        const dayProgress = await this.challengeService.getTodayProgress(
          this.activeChallenge.id,
          day.fullDate.toISOString().split('T')[0]
        );
        day.hasCompletedTasks = Object.values(dayProgress).some(Boolean);
      }
    }
  }

  isCurrentDay(date: number): boolean {
    const today = new Date();
    return date === today.getDate() && 
           this.selectedDate.getMonth() === today.getMonth() &&
           this.selectedDate.getFullYear() === today.getFullYear();
  }

  isPastDay(date: Date): boolean {
    return new Date(date).getTime() < new Date().setHours(0, 0, 0, 0);
  }

  isFutureDay(date: Date): boolean {
    return new Date(date).getTime() > new Date().setHours(23, 59, 59, 999);
  }

  isChallengeDay(date: Date): boolean {
    if (!this.activeChallenge) return false;
    
    const challengeStart = new Date(this.activeChallenge.startDate);
    const challengeEnd = new Date(this.activeChallenge.endDate);
    const checkDate = new Date(date);
    
    return checkDate >= challengeStart && checkDate <= challengeEnd;
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
    try {
      const { value: name } = await Preferences.get({ key: 'name' });
      if (name) {
        this.userName = name;
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
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
      const activeChallenge = await firstValueFrom(this.challengeService.getActiveChallenge());
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

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  goToSettings() {
    this.router.navigate(['/settings']);
  }

  handleAvatarError(event: any) {
    const img = event.target;
    img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.userName)}&background=random`;
  }

  private async checkAuth() {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      await this.router.navigate(['/auth']);
    }
  }
}
