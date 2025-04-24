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
import { PointsService } from '../../services/points.service';
import { HabitTrackerService } from '../../services/habit-tracker.service';

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
  currentWish: string | null = '';
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
  private readonly CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 34; // 2πr, де r = 34 (радіус кола)

  isToday: boolean = false;

  selectedPeriod: 'week' | 'month' | 'year' = 'week';
  chart: Chart | null = null;

  private readonly WISH_OPENED_KEY = 'wish_opened_date';
  private readonly NOTIFICATION_CHECK_KEY = 'notification_check_date';
  private readonly NOTIFICATION_STATE_KEY = 'notification_state';
  private readonly EMOTION_ADDED_KEY = 'emotion_added_date';

  private notificationState = {
    notifications: false,
    emotionalState: false,
    dailyWish: false
  };

  public hasWishBeenOpened = false;

  completedHabits: Set<string> = new Set();

  isWishHidden = false;

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
    private habitService: HabitService,
    private pointsService: PointsService,
    private habitTracker: HabitTrackerService,
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

    // Перевіряємо, чи було відкрито побажання сьогодні
    const { value: wishValue } = await Preferences.get({ key: this.WISH_OPENED_KEY });
    if (wishValue) {
      try {
        const lastOpenedDate = new Date(wishValue);
        const today = new Date();

        // Встановлюємо час на початок дня для коректного порівняння
        lastOpenedDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        this.hasWishBeenOpened = lastOpenedDate.getTime() === today.getTime();

        // Якщо побажання вже було відкрито сьогодні, очищуємо його
        if (this.hasWishBeenOpened) {
          this.currentWish = null;
        }
      } catch (error) {
        console.error('Error parsing wish date:', error);
        this.hasWishBeenOpened = false;
      }
    } else {
      this.hasWishBeenOpened = false;
    }

    // Перевіряємо стан сповіщень для нового дня
    await this.checkNotificationStateForNewDay();

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
    await this.loadCompletedHabits();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async loadActiveChallenge() {
    try {
      // Завантажуємо збережений стан завдань
      const { value: savedTasks } = await Preferences.get({ key: 'allDailyTasks' });
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        const today = new Date().toDateString();
        if (parsedTasks.date === today) {
          this.allDailyTasks = parsedTasks.tasks;
        }
      }

      this.challengeService.getActiveChallenge().subscribe(async challenge => {
        console.log('Active challenge received:', challenge);
        this.activeChallenge = challenge;

        if (this.activeChallenge) {
          const startDate = this.activeChallenge.startDate ? new Date(this.activeChallenge.startDate) : new Date();
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - startDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // Перевіряємо прогрес челенджу
          const progressCheck = await this.challengeService.checkChallengeProgress(this.activeChallenge);

          if (progressCheck.completed) {
            // Якщо челендж завершився, оновлюємо його статус
            await this.challengeService.updateChallengeStatus(this.activeChallenge.id, 'completed');

            // Показуємо повідомлення про завершення
            const toast = await this.toastController.create({
              message: `Челендж завершено на ${progressCheck.progress.toFixed(1)}%. Нараховано ${progressCheck.points} балів`,
              duration: 5000,
              position: 'bottom',
              color: 'success'
            });
            await toast.present();

            // Оновлюємо дані профілю
            await this.authService.updateUserPoints(progressCheck.points);

            this.activeChallenge = null;
            this.dailyTasks = [];
            this.challengeDay = 0;
            this.currentDay = 0;
            this.totalDays = 0;
            return;
          }

          // Перевіряємо, чи челендж не завершився за часом
          if (diffDays > this.activeChallenge.duration) {
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
        }

        // Запускаємо детекцію змін після оновлення значень
        this.cdr.detectChanges();
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
      console.log('!! this.activeChallenges: ', this.activeChallenges);

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

      // Зберігаємо оновлений стан
      await Preferences.set({
        key: 'allDailyTasks',
        value: JSON.stringify({
          date: new Date().toDateString(),
          tasks: this.allDailyTasks
        })
      });

    } catch (error) {
      console.error('Error loading active challenges:', error);
    }
  }

  generateWeekDays() {
    const today = new Date();
    const weekStart = startOfWeek(today);
    const locale = this.translate.currentLang === 'uk' ? uk : enUS;

    this.weekDays = Array.from({length: 7}, (_, i) => {
      const date = addDays(weekStart, i);
      return {
        name: format(date, 'EEE', {locale}).slice(0, 2),
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
    this.currentWeekLabel = `${firstDay.getDate()} - ${lastDay.getDate()} ${lastDay.toLocaleString('uk-UA', {month: 'long'})}`;
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

  async goToNotifications() {
    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        this.notificationState.notifications = false;
        await this.saveNotificationState();
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
        this.util.navigateToPage('/tabs/habits', {queryParams: {type}});
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
      const {value: name} = await Preferences.get({key: 'name'});
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

    this.notificationState.dailyWish = false;
    await this.saveNotificationState();

    return await modal.present();
  }

  // Wish modal window
  async showWish(): Promise<void> {
    // Set initial state for new day

      if (!this.hasWishBeenOpened) {
        await this.pointsService.addPoints(5);
        this.hasWishBeenOpened = true;

        // Зберігаємо дату відкриття
        await Preferences.set({
          key: this.WISH_OPENED_KEY,
          value: new Date().toISOString()
        });

        const toast = await this.toastController.create({
          message: this.translate.instant('POINTS.EARNED', {points: 5}),
          duration: 3000,
          position: 'bottom',
          color: 'success'
        });
        await toast.present();
      }

    // Додаємо клас для анімації зникнення
    this.isWishHidden = true;

    // Видаляємо картку після завершення анімації
    setTimeout(() => {
      this.currentWish = null;
      this.isWishHidden = false;
    }, 500);
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
    console.log('getCurrentUser: ', user);
    return !!user;
  }

  async loadAverageMetrics() {
    try {
      // Отримуємо всі записи користувача
      const userEntries = await this.progressService.getAllUserProgress();

      if (userEntries && userEntries.length > 0) {
        // Підраховуємо суму всіх значень
        const totals = userEntries.reduce((acc: {
          steps: number;
          sleep: number;
          water: number
        }, entry: UserProgress) => {
          return {
            steps: acc.steps + (entry.steps || 0),
            sleep: acc.sleep + (entry.sleepHours || 0),
            water: acc.water + (entry.waterAmount || 0)
          };
        }, {steps: 0, sleep: 0, water: 0});

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

      // Відстежуємо завершення звички
      if (isCompleted) {
        await this.habitTracker.markHabitAsCompleted(task.name);
        this.completedHabits.add(task.name);
      } else {
        this.completedHabits.delete(task.name);
      }

      // Оновлюємо завдання в обох списках
      this.dailyTasks = this.dailyTasks.map(t =>
        t.name === task.name ? {...t, completed: isCompleted} : t
      );
      this.allDailyTasks = this.allDailyTasks.map(t =>
        t.name === task.name ? {...t, completed: isCompleted} : t
      );

      // Зберігаємо оновлений стан
      await Preferences.set({
        key: 'allDailyTasks',
        value: JSON.stringify({
          date: new Date().toDateString(),
          tasks: this.allDailyTasks
        })
      });

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
        message: this.translate.instant(isCompleted ? 'TASKS.TASK_COMPLETED' : 'TASKS.TASK_CANCELLED'),
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
    const progress = this.getProgressPercentage(challenge);
    return (this.CIRCLE_CIRCUMFERENCE * (1 - progress / 100)).toString();
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

      const {data} = await modal.onDidDismiss();

      if (data) {
        try {
          // Перевіряємо, чи користувач вже додавав емоцію сьогодні
          const { value: lastEmotionDate } = await Preferences.get({ key: this.EMOTION_ADDED_KEY });
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          let shouldAwardPoints = false;

          if (lastEmotionDate) {
            const lastDate = new Date(lastEmotionDate);
            lastDate.setHours(0, 0, 0, 0);
            shouldAwardPoints = lastDate.getTime() !== today.getTime();
          } else {
            shouldAwardPoints = true;
          }

          // Зберігаємо емоцію
          await this.emotionService.saveEmotion(data);

          // Оновлюємо дані в сервісі
          await this.emotionService.loadEmotions();

          // Оновлюємо календар через сервіс
          await this.emotionService.refreshCalendar();

          // Якщо це перша емоція за день, нараховуємо бали
          if (shouldAwardPoints) {
            await this.pointsService.addPoints(1); // Нараховуємо 1 бал
            await Preferences.set({
              key: this.EMOTION_ADDED_KEY,
              value: today.toISOString()
            });

            const toast = await this.toastController.create({
              message: this.translate.instant('POINTS.EARNED', {points: 1}),
              duration: 4000,
              position: 'bottom',
              color: 'success'
            });
            await toast.present();
          }

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
              backgroundColor: '#36A2EB20',
              tension: 0.4,
              fill: false,
              yAxisID: 'stepsAxis'
            },
            {
              label: this.translate.instant('HOME.CHART.EMOTIONS'),
              data: data.emotions,
              borderColor: '#FF6384',
              backgroundColor: '#FF638420',
              tension: 0.4,
              fill: false,
              yAxisID: 'mainAxis'
            },
            {
              label: this.translate.instant('HOME.CHART.HABITS'),
              data: data.habits,
              borderColor: '#4BC0C0',
              backgroundColor: '#4BC0C020',
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
    const endDate = new Date();
    let startDate = new Date();

    switch (this.selectedPeriod) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    // Отримуємо дані про емоції
    const emotions = await this.emotionalService.getEmotionalStates(startDate, endDate);

    // Отримуємо дані про прогрес
    const progress = await this.progressService.getUserProgressInRange(startDate, endDate);

    // Отримуємо дані про звички
    const habits = await this.challengeService.getChallengesProgress(startDate, endDate);

    // Форматуємо дані для графіка
    const labels: string[] = [];
    const stepsData: number[] = [];
    const emotionsData: number[] = [];
    const habitsData: number[] = [];

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = format(currentDate,
        this.selectedPeriod === 'week' ? 'HH:mm' :
          this.selectedPeriod === 'month' ? 'dd.MM' : 'MM.yyyy'
      );
      labels.push(dateStr);

      // Знаходимо відповідні дані для цієї дати
      const dayEmotions = emotions.filter(e => isSameDay(new Date(e.date), currentDate));
      const dayProgress = progress.find(p => isSameDay(new Date(p.date), currentDate));

      // Знаходимо звички для поточної дати
      const dayHabits = habits.filter(habit =>
        isSameDay(new Date(habit.date), currentDate)
      );

      // Розраховуємо показники
      const stepsValue = dayProgress ? dayProgress.steps : 0;
      const emotionsValue = dayEmotions.length > 0 ?
        dayEmotions.reduce((sum, e) => sum + e.value, 0) / dayEmotions.length : 0;
      const habitsValue = this.calculateHabitsValue(dayHabits);

      stepsData.push(stepsValue);
      emotionsData.push(emotionsValue);
      habitsData.push(habitsValue);

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      labels,
      steps: stepsData,
      emotions: emotionsData,
      habits: habitsData
    };
  }

  private calculateHabitsValue(habits: ChallengeProgress[]): number {
    if (!habits || habits.length === 0) return 0;

    const totalCompletedRatio = habits.reduce((sum, habit) => {
      const completed = habit.completedTasks || 0;
      const total = habit.totalTasks || 1;
      return sum + (completed / total);
    }, 0);

    // Повертаємо середнє значення від 0 до 10
    return (totalCompletedRatio / habits.length) * 10;
  }

  async onPeriodChange(event: any) {
    const value = event.detail.value;
    if (value === 'week' || value === 'month' || value === 'year') {
      await this.changePeriod(value);
    }
  }

  async goToChallenges() {
    await this.router.navigate(['/tabs/challenges']);
  }

  private async loadNotificationState() {
    try {
      const {value} = await Preferences.get({key: 'notificationState'});
      if (value) {
        this.notificationState = JSON.parse(value);
      } else {
        // Set initial state for new day
        const today = new Date().toDateString();
        const {value: lastCheck} = await Preferences.get({key: 'lastNotificationCheck'});

        if (lastCheck !== today) {
          this.notificationState = {
            notifications: true,
            emotionalState: true,
            dailyWish: true
          };
          await this.saveNotificationState();
          await Preferences.set({key: 'lastNotificationCheck', value: today});
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

  hasNotification(buttonType: 'notifications' | 'emotionalState' | 'dailyWish'): boolean {
    if (!this.notificationState) {
      return false;
    }
    return this.notificationState[buttonType] ?? false;
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

  private async loadCompletedHabits() {
    try {
      // Очищаємо старі записи при завантаженні сторінки
      await this.habitTracker.clearOldCompletions();

      // Завантажуємо завершені звички для сьогоднішнього дня
      for (const task of this.allDailyTasks) {
        const isCompleted = await this.habitTracker.isHabitCompletedToday(task.name);
        if (isCompleted) {
          this.completedHabits.add(task.name);
        }
      }
    } catch (error) {
      console.error('Error loading completed habits:', error);
    }
  }

  isHabitCompletedToday(taskName: string): boolean {
    return this.completedHabits.has(taskName);
  }

  private async checkNotificationStateForNewDay() {
    try {
      const { value: lastCheckValue } = await Preferences.get({ key: this.NOTIFICATION_CHECK_KEY });
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let shouldResetNotifications = false;

      if (lastCheckValue) {
        const lastCheckDate = new Date(lastCheckValue);
        lastCheckDate.setHours(0, 0, 0, 0);

        // Якщо остання перевірка була не сьогодні, скидаємо стан сповіщень
        if (lastCheckDate.getTime() !== today.getTime()) {
          shouldResetNotifications = true;
        }
      } else {
        // Якщо немає збереженої дати, вважаємо це новим днем
        shouldResetNotifications = true;
      }

      if (shouldResetNotifications) {
        // Оновлюємо стан сповіщень для нового дня
        this.notificationState = {
          notifications: true,
          emotionalState: true,
          dailyWish: true
        };
        await this.saveNotificationState();
        // Зберігаємо поточну дату як дату останньої перевірки
        await Preferences.set({
          key: this.NOTIFICATION_CHECK_KEY,
          value: today.toISOString()
        });
      } else {
        // Завантажуємо збережений стан сповіщень
        const { value: stateValue } = await Preferences.get({ key: this.NOTIFICATION_STATE_KEY });
        if (stateValue) {
          this.notificationState = JSON.parse(stateValue);
        }
      }
    } catch (error) {
      console.error('Error checking notification state for new day:', error);
    }
  }

}
