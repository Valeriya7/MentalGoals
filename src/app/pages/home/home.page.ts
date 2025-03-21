import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UtilService } from 'src/app/services/util.service';
import { Preferences } from '@capacitor/preferences';
import { NavigationExtras } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, addDays } from 'date-fns';
import { uk, enUS } from 'date-fns/locale';
import { ProgressService, UserProgress } from '../../services/progress.service';

interface DiaryEntry {
  date: Date;
  mood: number;
  sleep: number;
}

interface DayInfo {
  name: string;
  date: string;
  marked: boolean;
  fullDate: Date;
}

interface DailyTask {
  name: string;
  icon: string;
  completed: boolean;
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
  weekDays: DayInfo[] = [];
  selectedDate: Date = new Date();
  currentWeekLabel: string = '';
  activeChallenge: Challenge | null = null;
  challengeDay: number = 0;
  currentDay = 0;
  totalDays = 40;
  
  dailyTasks: DailyTask[] = [];
  
  hasUnreadWish = false;
  currentWish = '';
  private subscriptions: Subscription[] = [];
  stepsCount = '12,345';
  sleepHours = '7:30 Hr';
  waterAmount = '1.5 L';
  averageSteps: number = 0;
  averageSleep: number = 0;
  averageWater: number = 0;

  constructor(
    private router: Router,
    private util: UtilService,
    private wishesService: WishesService,
    private challengeService: ChallengeService,
    private modalService: ModalService,
    private toastController: ToastController,
    private authService: AuthService,
    private translate: TranslateService,
    private progressService: ProgressService
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
    const isAuthenticated = await this.checkAuth();
    if (!isAuthenticated) {
      await this.router.navigate(['/auth']);
      return;
    }

    console.log('Initializing home page...');
    
    // Підписуємось на зміни мови
    this.subscriptions.push(
      this.translate.onLangChange.subscribe(() => {
        console.log('Language changed to:', this.translate.currentLang);
        // Оновлюємо дні тижня при зміні мови
        this.generateWeekDays();
      })
    );

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
          this.userName = user.name || 'Користувач';
          this.userPhotoUrl = user.photoURL || null;
        }
      })
    );

    await this.loadActiveChallenge();
    this.generateWeekDays();
    await this.loadSelectedDayProgress();
    await this.loadAverageMetrics();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async loadActiveChallenge() {
    try {
      const activeChallenge = await firstValueFrom(this.challengeService.getActiveChallenge());
      console.log('Active challenge loaded:', activeChallenge);
      this.activeChallenge = activeChallenge;
      
      if (this.activeChallenge) {
        const startDate = this.activeChallenge.startDate ? new Date(this.activeChallenge.startDate) : new Date();
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        this.challengeDay = diffDays;
        this.currentDay = Math.min(diffDays + 1, this.activeChallenge.duration);
        this.totalDays = this.activeChallenge.duration;
        
        // Оновлюємо щоденні завдання з активного челенджу
        if (this.activeChallenge.tasks) {
          const todayProgress = await this.challengeService.getTodayProgress(this.activeChallenge.id);
          this.dailyTasks = this.activeChallenge.tasks.map(task => ({
            name: task.title,
            icon: task.icon || 'checkmark-circle-outline',
            completed: todayProgress[task.id] || false
          }));
        }
        
        console.log('Challenge days calculated:', {
          challengeDay: this.challengeDay,
          currentDay: this.currentDay,
          totalDays: this.totalDays,
          tasks: this.dailyTasks
        });
      } else {
        console.log('No active challenge found');
        this.dailyTasks = [];
      }
    } catch (error) {
      console.error('Error loading active challenge:', error);
    }
  }

  generateWeekDays() {
    const today = new Date();
    const weekStart = startOfWeek(today);
    const locale = this.translate.currentLang === 'uk' ? uk : enUS;

    this.weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return {
        name: format(date, 'EEE', { locale }).slice(0, 2),
        date: format(date, 'd'),
        marked: Math.random() > 0.5, // Приклад позначення днів
        fullDate: date
      };
    });

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
        day.marked = Object.values(dayProgress).some(Boolean);
      }
    }
  }

  isCurrentDay(dayNumber: string): boolean {
    return dayNumber === format(new Date(), 'd');
  }

  isPastDay(date: Date): boolean {
    return new Date(date).getTime() < new Date().setHours(0, 0, 0, 0);
  }

  isFutureDay(date: Date): boolean {
    return new Date(date).getTime() > new Date().setHours(23, 59, 59, 999);
  }

  isChallengeDay(date: Date): boolean {
    if (!this.activeChallenge) return false;
    
    const challengeStart = this.activeChallenge.startDate ? new Date(this.activeChallenge.startDate) : new Date();
    const challengeEnd = this.activeChallenge.endDate ? new Date(this.activeChallenge.endDate) : new Date();
    const checkDate = new Date(date);
    
    return checkDate >= challengeStart && checkDate <= challengeEnd;
  }

  async goToCalendar() {
    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        console.log('Navigating to calendar, user:', user);
        this.util.navigateToPage('/calendar');
      } else {
        console.log('No user, redirecting to auth');
        this.util.navigateToPage('/auth');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      this.util.navigateToPage('/auth');
    }
  }

  async goToNotifications() {
    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        this.util.navigateToPage('/tabs/notifications');
      } else {
        this.util.navigateToPage('/auth');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      this.util.navigateToPage('/auth');
    }
  }

  async goToHabit(type: string) {
    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        this.util.navigateToPage('/tabs/habits', { queryParams: { type } });
      } else {
        this.util.navigateToPage('/auth');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      this.util.navigateToPage('/auth');
    }
  }

  async goToLifeWheel() {
    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        this.util.navigateToPage('/life-wheel');
      } else {
        this.util.navigateToPage('/auth');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      this.util.navigateToPage('/auth');
    }
  }

  async goToProfile() {
    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        this.util.navigateToPage('/tabs/profile');
      } else {
        this.util.navigateToPage('/auth');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      this.util.navigateToPage('/auth');
    }
  }

  async goToSettings() {
    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        this.util.navigateToPage('/tabs/settings');
      } else {
        this.util.navigateToPage('/auth');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      this.util.navigateToPage('/auth');
    }
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
      if (this.activeChallenge) {
        await this.router.navigate(['/challenge-details', this.activeChallenge.id]);
      } else {
        await this.router.navigate(['/tabs/challenges']);
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

  handleAvatarError(event: any) {
    const img = event.target;
    img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.userName)}&background=random`;
  }

  private async checkAuth(): Promise<boolean> {
    const user = await this.authService.getCurrentUser();
    console.log('getCurrentUser: ',user);
    return !!user;
  }

  async loadAverageMetrics() {
    try {
      // Отримуємо всі записи користувача
      const userEntries = await this.progressService.getAllUserProgress();
      
      if (userEntries && userEntries.length > 0) {
        // Підраховуємо суму всіх значень
        const totals = userEntries.reduce((acc: { steps: number; sleep: number; water: number }, entry: UserProgress) => {
          return {
            steps: acc.steps + (entry.steps || 0),
            sleep: acc.sleep + (entry.sleepHours || 0),
            water: acc.water + (entry.waterAmount || 0)
          };
        }, { steps: 0, sleep: 0, water: 0 });

        // Обчислюємо середні значення
        const entriesCount = userEntries.length;
        this.averageSteps = Math.round(totals.steps / entriesCount);
        this.averageSleep = Number((totals.sleep / entriesCount).toFixed(1));
        this.averageWater = Number((totals.water / entriesCount).toFixed(1));
      } else {
        // Якщо записів немає, встановлюємо нульові значення
        this.averageSteps = 0;
        this.averageSleep = 0;
        this.averageWater = 0;
      }
    } catch (error) {
      console.error('Error loading average metrics:', error);
      // У випадку помилки також встановлюємо нульові значення
      this.averageSteps = 0;
      this.averageSleep = 0;
      this.averageWater = 0;
    }
  }
}
