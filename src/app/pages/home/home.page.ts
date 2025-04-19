import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UtilService } from 'src/app/services/util.service';
import { Preferences } from '@capacitor/preferences';
import { NavigationExtras } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { WishesService } from '../../services/wishes.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { WishModalComponent } from '../../components/wish-modal/wish-modal.component';
import { ChallengeService } from '../../services/challenge.service';
import { Challenge, ChallengePhase, ChallengeTask } from '../../interfaces/challenge.interface';
import { DiaryEntry, DayInfo, DailyTask, EmotionalState, ChallengeProgress } from '../../interfaces/home.interface';
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
  personCircleOutline,
  happyOutline
} from 'ionicons/icons';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ToastController, ModalController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';
import { WishService } from '../../services/wish.service';
import { Wish } from '../../models/wish.model';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, addDays, addHours, addMonths } from 'date-fns';
import { uk, enUS } from 'date-fns/locale';
import { ProgressService, UserProgress } from '../../services/progress.service';
import { DailyWishComponent } from '../../components/daily-wish/daily-wish.component';
import { EmotionalService } from '../../services/emotional.service';
import { EmotionalStateModalComponent } from '../../components/emotional-state-modal/emotional-state-modal.component';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { Emotion } from '../../models/emotion.model';
import { PlatformCheckService } from '../../services/platform-check.service';
import { VersionCheckService } from '../../services/version-check.service';
import { EmotionService } from '../../services/emotion.service';
import { HabitService } from '../../services/habit.service';
import { Habit } from '../../models/habit.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslateModule, RouterModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomePage implements OnInit, OnDestroy {
  @ViewChild('achievementChart') achievementChart!: ElementRef;

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
  activeChallenges: Challenge[] = [];
  allDailyTasks: DailyTask[] = [];

  hasUnreadWish = false;
  currentWish = '';
  private subscriptions: Subscription[] = [];
  stepsCount = '12,345';
  sleepHours = '7:30 Hr';
  waterAmount = '1.5 L';
  averageSteps: number = 0;
  averageSleep: number = 0;
  averageWater: number = 0;
  challenges: Challenge[] = [];
  Math = Math;

  // Константа для розрахунку довжини кола
  private readonly CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 54; // 2πr, де r = 54 (радіус кола)

  isToday: boolean = false;

  selectedPeriod: 'week' | 'month' | 'year' = 'week';
  chart: Chart | null = null;

  private notificationState = {
    notifications: false,
    emotionalState: false,
    dailyWish: false
  };
  notificationState2: {
    notifications?: { shouldShow: boolean };
    emotionalState?: { shouldShow: boolean };
    dailyWish?: { shouldShow: boolean };
  } = {};

  constructor(
    private router: Router,
    private util: UtilService,
    private wishesService: WishesService,
    private challengeService: ChallengeService,
    private modalService: ModalService,
    private toastController: ToastController,
    private authService: AuthService,
    private translate: TranslateService,
    private progressService: ProgressService,
    private modalCtrl: ModalController,
    private emotionalService: EmotionalService,
    private cdr: ChangeDetectorRef,
    private platformCheckService: PlatformCheckService,
    private versionCheckService: VersionCheckService,
    private emotionService: EmotionService,
    private habitService: HabitService
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
      personCircleOutline,
      happyOutline
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
    await this.loadNotificationState();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async loadActiveChallenge() {
    try {
      // Підписуємось на зміни активних челенджів
      this.challengeService.getActiveChallenge().subscribe(async challenge => {
        console.log('Active challenge received:', challenge);
        this.activeChallenge = challenge;

        if (this.activeChallenge) {
          const startDate = this.activeChallenge.startDate ? new Date(this.activeChallenge.startDate) : new Date();
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - startDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // Перевіряємо, чи челендж не завершився
          if (diffDays > this.activeChallenge.duration) {
            // Якщо челендж завершився, оновлюємо його статус
            await this.challengeService.updateChallengeStatus(this.activeChallenge.id, 'completed');
            this.activeChallenge = null;
            this.dailyTasks = [];
            this.challengeDay = 0;
            this.currentDay = 0;
            this.totalDays = 0;
            return;
          }

          this.challengeDay = diffDays;
          this.currentDay = Math.min(diffDays + 1, this.activeChallenge.duration);
          this.totalDays = this.activeChallenge.duration;

          // Оновлюємо щоденні завдання з активного челенджу
          if (this.activeChallenge && this.activeChallenge.tasks) {
            const todayProgress = await this.challengeService.getTodayProgress(this.activeChallenge.id);
            console.log('Today progress:', todayProgress);

            this.dailyTasks = this.activeChallenge.tasks.map(task => ({
              name: task.title,
              icon: task.icon || 'checkmark-circle-outline',
              completed: todayProgress[task.id] || false,
              title: task.title,
              description: task.description,
              challengeId: this.activeChallenge?.id || '',
              challengeTitle: this.activeChallenge?.title || ''
            }));

            // Сортуємо завдання: невиконані зверху, виконані знизу
            this.dailyTasks.sort((a, b) => {
              if (a.completed === b.completed) return 0;
              return a.completed ? 1 : -1;
            });

            // Перевіряємо, чи є виконані завдання для сьогоднішнього дня
            const hasCompletedTasks = Object.values(todayProgress).some(Boolean);
            const today = new Date();
            const todayStr = format(today, 'd');

            // Оновлюємо marked тільки для сьогоднішнього дня
            this.weekDays.forEach(day => {
              if (day.date === todayStr) {
                day.marked = hasCompletedTasks;
                console.log('Today day marked status:', day.marked);
              } else {
                day.marked = false;
              }
            });
          }
        } else {
          this.dailyTasks = [];
          this.challengeDay = 0;
          this.currentDay = 0;
          this.totalDays = 0;

          // Запускаємо детекцію змін після оновлення значень
          this.cdr.detectChanges();
        }
      });

      // Завантажуємо всі активні челенджі
      const challenges = await this.challengeService.getChallenges();
      // Фільтруємо тільки активні челенджі, які не завершилися
      this.activeChallenges = challenges.filter(c => {
        if (c.status !== 'active') return false;
        const startDate = c.startDate ? new Date(c.startDate) : new Date();
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= c.duration;
      });

      // Завантажуємо завдання для всіх активних челенджів
      this.allDailyTasks = [];
      let hasAnyCompletedTasks = false;

      for (const challenge of this.activeChallenges) {
        if (challenge.tasks) {
          const todayProgress = await this.challengeService.getTodayProgress(challenge.id);
          const tasks = challenge.tasks.map(task => ({
            name: task.title,
            icon: task.icon || 'checkmark-circle-outline',
            completed: todayProgress[task.id] || false,
            title: task.title,
            description: task.description,
            challengeId: challenge.id,
            challengeTitle: challenge.title
          }));
          this.allDailyTasks.push(...tasks);

          // Перевіряємо, чи є виконані завдання для сьогоднішнього дня
          const hasCompletedTasks = Object.values(todayProgress).some(Boolean);
          if (hasCompletedTasks) {
            hasAnyCompletedTasks = true;
          }
        }
      }

      // Оновлюємо маркер в календарі тільки для сьогоднішнього дня
      const today = new Date();
      const todayStr = format(today, 'd');

      this.weekDays.forEach(day => {
        if (day.date === todayStr) {
          day.marked = hasAnyCompletedTasks;
          console.log('Today day marked status (all challenges):', day.marked);
        } else {
          day.marked = false;
        }
      });

      // Сортуємо всі завдання: невиконані зверху, виконані знизу
      this.allDailyTasks.sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
      });

    } catch (error) {
      console.error('Error loading active challenges:', error);
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

        // Перевіряємо, чи є виконані завдання для цього дня
        const hasCompletedTasks = Object.values(dayProgress).some(Boolean);

        // Оновлюємо marked тільки для минулих днів та сьогоднішнього дня
        const isPastDay = day.fullDate < new Date(new Date().setHours(0, 0, 0, 0));
        const isToday = isSameDay(day.fullDate, new Date());

        day.marked = (isPastDay || isToday) && hasCompletedTasks;
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
        this.util.navigateToPage('/tabs/habits');
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

  async openDailyWish() {
    const modal = await this.modalCtrl.create({
      component: DailyWishComponent,
      cssClass: 'half-modal'
    });
    return await modal.present();
  }

  // Wish modal window
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

  async updateTaskProgress(task: DailyTask, event: any) {
    if (!task.challengeId) return;

    const isCompleted = event.detail.checked;

    try {
      // Оновлюємо локальний стан
      task.completed = isCompleted;

      // Оновлюємо прогрес на сервері
      await this.challengeService.updateTodayProgress(task.challengeId, task.name, isCompleted);

      // Оновлюємо завдання в обох списках
      this.dailyTasks = this.dailyTasks.map(t =>
        t.name === task.name ? { ...t, completed: isCompleted } : t
      );
      this.allDailyTasks = this.allDailyTasks.map(t =>
        t.name === task.name ? { ...t, completed: isCompleted } : t
      );

      // Сортуємо завдання
      this.dailyTasks.sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
      });
      this.allDailyTasks.sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
      });

      // Показуємо повідомлення про успіх
      const toast = await this.toastController.create({
        message: this.translate.instant(isCompleted ? 'TASKS.TASK_COMPLETED' : 'TASKS.TASK_CANCELLED'), //isCompleted ? 'Завдання виконано!' : 'Завдання скасовано',
        duration: 2000,
        position: 'bottom',
        color: isCompleted ? 'success' : 'medium'
      });
      await toast.present();

    } catch (error) {
      console.error('Error updating task progress:', error);
      // Повертаємо попередній стан у випадку помилки
      task.completed = !isCompleted;

      // Показуємо повідомлення про помилку
      const toast = await this.toastController.create({
        message: this.translate.instant('TASKS.UPDATE_ERROR'),
        duration: 2000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }

  // Отримуємо довжину кола для SVG
  getProgressCircumference(challenge: Challenge): string {
    return this.CIRCLE_CIRCUMFERENCE.toString();
  }

  // Отримуємо зміщення для SVG (прогрес)
  getProgressOffset(challenge: Challenge): string {
    const startDate = challenge.startDate ? new Date(challenge.startDate) : new Date();
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const currentDay = Math.min(diffDays + 1, challenge.duration);
    const progress = currentDay / challenge.duration;
    return (this.CIRCLE_CIRCUMFERENCE * (1 - progress)).toString();
  }

  // Отримуємо відсоток прогресу
  getProgressPercentage(challenge: Challenge): number {
    const startDate = challenge.startDate ? new Date(challenge.startDate) : new Date();
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const currentDay = Math.min(diffDays + 1, challenge.duration);
    return Math.round((currentDay / challenge.duration) * 100);
  }

  // Отримуємо поточний день челенджу
  getCurrentDay(challenge: Challenge): number {
    const startDate = challenge.startDate ? new Date(challenge.startDate) : new Date();
    const today = new Date();

    // Встановлюємо час на початок дня для коректного порівняння
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // Обчислюємо різницю в днях
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.min(diffDays + 1, challenge.duration);
  }

  async openEmotionalStateModal() {
    try {
      // Зберігаємо стан натискання
      this.notificationState.emotionalState = false;
      await this.saveNotificationState();

      // Навігуємо на сторінку календаря емоцій
      await this.router.navigate(['/tabs/emotional-calendar']);

      // Відкриваємо модальне вікно
      const modal = await this.modalCtrl.create({
        component: EmotionalStateModalComponent
      });

      await modal.present();

      const { data } = await modal.onDidDismiss();

      if (data) {
        try {
          // Зберігаємо емоцію
          await this.emotionService.saveEmotion(data);

          // Оновлюємо дані в сервісі
          await this.emotionService.loadEmotions();

          // Оновлюємо календар через сервіс
          await this.emotionService.refreshCalendar();

          const toast = await this.toastController.create({
            message: 'Емоцію збережено',
            duration: 2000,
            position: 'bottom',
            color: 'success'
          });
          await toast.present();
        } catch (error) {
          console.error('Error saving emotion:', error);
          const toast = await this.toastController.create({
            message: 'Помилка при збереженні емоції',
            duration: 2000,
            position: 'bottom',
            color: 'danger'
          });
          await toast.present();
        }
      }
    } catch (error) {
      console.error('Error opening emotional state modal:', error);
      const toast = await this.toastController.create({
        message: 'Помилка при відкритті календаря емоцій',
        duration: 2000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }

  getDayName(dayNumber: number): string {
    const days = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота', 'Неділя'];
    return days[(dayNumber - 1) % 7];
  }

  async ionViewWillEnter() {
    try {
      await this.loadActiveChallenge();
      await this.loadSelectedDayProgress();
      await this.loadAverageMetrics();
      await this.updateAchievementChart();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  // Метод для зміни періоду
  async changePeriod(period: 'week' | 'month' | 'year') {
    this.selectedPeriod = period;
    await this.updateAchievementChart();
  }

  // Метод для оновлення графіка
  async updateAchievementChart() {
    try {
      const data = await this.getAchievementData();
      if (!data || !data.labels || data.labels.length === 0) {
        console.warn('No data available for chart');
        return;
      }

      if (this.chart) {
        this.chart.destroy();
      }

      const config: ChartConfiguration = {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [
            {
              label: this.translate.instant('HOME.CHART.STEPS'),
              data: data.steps,
              borderColor: '#36A2EB',
              tension: 0.4,
              fill: false,
              yAxisID: 'stepsAxis'
            },
            {
              label: this.translate.instant('HOME.CHART.EMOTIONS'),
              data: data.emotions,
              borderColor: '#FF6384',
              tension: 0.4,
              fill: false,
              yAxisID: 'mainAxis'
            },
            {
              label: this.translate.instant('HOME.CHART.HABITS'),
              data: data.habits,
              borderColor: '#4BC0C0',
              tension: 0.4,
              fill: false,
              yAxisID: 'mainAxis'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          scales: {
            mainAxis: {
              type: 'linear',
              position: 'left',
              beginAtZero: true,
              max: 10,
              title: {
                display: true,
                text: this.translate.instant('HOME.CHART.LEVEL')
              }
            },
            stepsAxis: {
              type: 'linear',
              position: 'right',
              beginAtZero: true,
              title: {
                display: true,
                text: this.translate.instant('HOME.CHART.STEPS_COUNT')
              },
              grid: {
                drawOnChartArea: false
              }
            }
          },
          plugins: {
            tooltip: {
              mode: 'index',
              intersect: false
            },
            legend: {
              position: 'top',
              labels: {
                usePointStyle: true,
                pointStyle: 'circle'
              }
            }
          }
        }
      };

      this.chart = new Chart(this.achievementChart.nativeElement, config);
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error updating achievement chart:', error);
    }
  }

  // Метод для отримання даних для графіка
  async getAchievementData() {
    const startDate = this.getStartDate();
    const endDate = new Date();

    // Отримуємо дані про емоції
    const emotions = await this.emotionalService.getEmotionalStates(startDate, endDate);
    console.log('Fetched emotions:', emotions);

    // Отримуємо дані про прогрес
    const progress = await this.progressService.getUserProgressInRange(startDate, endDate);
    console.log('Fetched progress:', progress);

    // Отримуємо дані про звички
    const habits = await this.habitService.getHabits();
    console.log('Fetched habits:', habits);

    // Форматуємо дані для графіка
    const labels: string[] = [];
    const steps: number[] = [];
    const emotionsData: number[] = [];
    const habitsData: number[] = [];

    // Генеруємо дати для вибраного періоду
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      labels.push(this.formatDate(currentDate));

      // Знаходимо відповідні дані для цієї дати
      const dayEmotions = emotions.filter(e => isSameDay(new Date(e.date), currentDate));
      const dayProgress = progress.find(p => isSameDay(new Date(p.date), currentDate));
      
      // Знаходимо звички для поточної дати
      const dayHabits = habits.filter(habit => {
        if (!habit.progress || !habit.isActive) return false;
        const progressValue = habit.progress[dateKey];
        return progressValue !== undefined && progressValue !== null;
      });

      console.log(`Habits for ${dateKey}:`, dayHabits);

      // Розраховуємо показники
      steps.push(dayProgress?.steps || 0);
      
      if (dayEmotions.length > 0) {
        const avgEmotion = dayEmotions.reduce((sum, e) => sum + e.value, 0) / dayEmotions.length;
        emotionsData.push(avgEmotion);
      } else {
        emotionsData.push(0);
      }

      habitsData.push(this.calculateHabitsValue(dayHabits));

      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('Final chart data:', {
      labels,
      steps,
      emotions: emotionsData,
      habits: habitsData
    });

    return {
      labels,
      steps,
      emotions: emotionsData,
      habits: habitsData
    };
  }

  private calculateHabitsValue(habits: Habit[]): number {
    if (!habits || habits.length === 0) {
      return 0;
    }

    // Розраховуємо загальний прогрес звичок
    const totalProgress = habits.reduce((sum, habit) => {
      if (!habit || !habit.category || !habit.progress) {
        return sum;
      }

      const dateKey = new Date().toISOString().split('T')[0];
      const progressValue = habit.progress[dateKey];

      // Нормалізуємо значення в діапазоні 0-1
      let normalizedValue = 0;
      switch (habit.category) {
        case 'fitness':
          normalizedValue = Math.min(progressValue / 10000, 1); // 10,000 кроків = 100%
          break;
        case 'mindfulness':
          normalizedValue = Math.min(progressValue / 10, 1); // 10 хвилин = 100%
          break;
        case 'nutrition':
          normalizedValue = Math.min(progressValue / 2, 1); // 2 літри = 100%
          break;
        case 'learning':
          normalizedValue = Math.min(progressValue / 30, 1); // 30 хвилин = 100%
          break;
        case 'health':
          normalizedValue = Math.min(progressValue / 7, 1); // 7 годин = 100%
          break;
        default:
          return sum;
      }

      return sum + normalizedValue;
    }, 0);

    // Повертаємо середнє значення прогресу
    return (totalProgress / habits.length) * 100;
  }

  async onPeriodChange(event: any) {
    const value = event.detail.value;
    if (value === 'week' || value === 'month' || value === 'year') {
      await this.changePeriod(value);
    }
  }
  async goToChallenges(){
    await this.router.navigate(['/tabs/challenges']);
  }

  private async loadNotificationState() {
    try {
      const { value } = await Preferences.get({ key: 'notificationState' });
      if (value) {
        this.notificationState = JSON.parse(value);
      } else {
        // Set initial state for new day
        const today = new Date().toDateString();
        const { value: lastCheck } = await Preferences.get({ key: 'lastNotificationCheck' });

        if (lastCheck !== today) {
          this.notificationState = {
            notifications: true,
            emotionalState: true,
            dailyWish: true
          };
          await this.saveNotificationState();
          await Preferences.set({ key: 'lastNotificationCheck', value: today });
        }
      }
    } catch (error) {
      console.error('Error loading notification state:', error);
    }
  }

  private async saveNotificationState() {
    try {
      await Preferences.set({
        key: 'notificationState',
        value: JSON.stringify(this.notificationState)
      });
    } catch (error) {
      console.error('Error saving notification state:', error);
    }
  }

  hasNotification(key: keyof typeof this.notificationState): boolean {
    return this.notificationState[key];
  }

  private createAchievementChart(data: any) {
    const ctx = document.getElementById('achievementChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: this.translate.instant('HOME.CHART.STEPS'),
            data: data.steps,
            borderColor: '#36A2EB',
            tension: 0.4,
            fill: false
          },
          {
            label: this.translate.instant('HOME.CHART.EMOTIONS_VALUE'),
            data: data.emotionsValue,
            borderColor: '#FF6384',
            tension: 0.4,
            fill: false
          },
          {
            label: this.translate.instant('HOME.CHART.EMOTIONS_ENERGY'),
            data: data.emotionsEnergy,
            borderColor: '#FF9F40',
            tension: 0.4,
            fill: false
          },
          {
            label: this.translate.instant('HOME.CHART.HABITS'),
            data: data.habits,
            borderColor: '#4BC0C0',
            tension: 0.4,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 10
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }
/*
      hasNotification(buttonType: 'notifications' | 'emotionalState' | 'dailyWish'): boolean {
          if (!this.notificationState) {
              return false;
      }
          return this.notificationState[buttonType]?.shouldShow ?? false;
    }
  */

  private getStartDate(): Date {
    const today = new Date();
    let startDate = new Date(today);

    switch (this.selectedPeriod) {
      case 'week':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
    }

    return startDate;
  }

  private formatDate(date: Date): string {
    switch (this.selectedPeriod) {
      case 'week':
        return format(date, 'HH:mm');
      case 'month':
        return format(date, 'dd.MM');
      case 'year':
        return format(date, 'MM.yyyy');
      default:
        return format(date, 'HH:mm');
    }
  }
}

