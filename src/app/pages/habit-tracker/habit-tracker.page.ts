import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Renderer2 } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { TranslateModule } from '@ngx-translate/core';
import { HabitsService } from '../../services/habits.service';
import { Habit } from '../../interfaces/habit.interface';
import { Subscription } from 'rxjs';
import '../../utils/icons'; // Імпортуємо централізовану реєстрацію іконок
import { TranslateService } from '@ngx-translate/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-habit-tracker',
  templateUrl: './habit-tracker.page.html',
  styleUrls: ['./habit-tracker.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, TranslateModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HabitTrackerPage implements OnInit, OnDestroy {
  today = new Date();
  selectedDate = new Date();
  currentMonth: Date[] = [];
  activeHabits: Habit[] = [];
  availableHabits: Habit[] = [];
  private habitsSubscription?: Subscription;
  isCreateHabitModalOpen = false;
  isEditHabitModalOpen = false;
  editingHabit: Habit | null = null;
  draggedHabit: Habit | null = null;
  newHabit: Habit = {
    id: '',
    name: '',
    description: '',
    icon: 'checkmark-circle-outline',
    category: 'health',
    difficulty: 'easy',
    points: 10,
    target: 0,
    unit: '',
    frequency: 'daily',
    isActive: false,
    isChallengeHabit: false,
    completionStatus: {},
    streak: { current: 0, best: 0 },
    progress: {}
  };

  constructor(
    private habitsService: HabitsService,
    private translateService: TranslateService,
    private alertController: AlertController,
    private toastController: ToastController,
    private renderer: Renderer2,
    private el: ElementRef
  ) {
    this.generateCalendarDays();
    this.editingHabit = {
      id: '',
      name: '',
      description: '',
      icon: 'ellipse-outline',
      category: 'health',
      difficulty: 'medium',
      points: 0,
      isActive: false,
      isChallengeHabit: false,
      isBaseHabit: false,
      completionStatus: {},
      streak: { current: 0, best: 0 },
      target: 1,
      unit: '',
      frequency: 'daily',
      progress: {}
    };
  }

  async ngOnInit() {
    // Примусово оновлюємо звички щоб переконатися що вони англійською мовою
    await this.habitsService.refreshHabits();
    this.loadHabits();
    this.setupDragAndDropListeners();
  }

  private setupDragAndDropListeners() {
    // Встановлюємо обробники подій з passive: false для dragover
    setTimeout(() => {
      const habitItems = this.el.nativeElement.querySelectorAll('.habit-item');
      habitItems.forEach((item: HTMLElement) => {
        // Використовуємо addEventListener напряму з passive: false
        item.addEventListener('dragover', (event: DragEvent) => {
          event.preventDefault();
          if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
          }
        }, { passive: false });
      });
    }, 100);
  }

  ngOnDestroy() {
    if (this.habitsSubscription) {
      this.habitsSubscription.unsubscribe();
    }
  }

  private loadHabits() {
    this.habitsSubscription = this.habitsService.getActiveHabits().subscribe(habits => {
      this.activeHabits = habits;
    });

    this.habitsService.getAvailableHabits().subscribe(habits => {
      this.availableHabits = habits;
    });
  }

  generateCalendarDays() {
    const year = this.selectedDate.getFullYear();
    const month = this.selectedDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    this.currentMonth = Array.from(
      { length: lastDay.getDate() },
      (_, i) => new Date(year, month, i + 1)
    );
  }

  async toggleHabitCompletion(habit: Habit, date: Date, status: 'completed' | 'partial' | 'not_completed') {
    try {
      await this.habitsService.toggleHabit(habit.id, date.toISOString().split('T')[0], status);

      // Перевіряємо, чи досягнуто ціль
      const targetReached = await this.habitsService.updateStreak(habit.id);

      if (targetReached) {
        // Показуємо повідомлення про досягнення цілі
        const toast = await this.toastController.create({
          message: this.translateService.instant('HABITS.TARGET_REACHED', { name: habit.name }),
          duration: 5000,
          position: 'bottom',
          color: 'success',
          icon: 'trophy-outline',
          cssClass: 'target-reached-toast'
        });
        await toast.present();

        // Додаємо клас для анімації
        const habitElement = document.querySelector(`[data-habit-id="${habit.id}"]`);
        if (habitElement) {
          habitElement.classList.add('target-reached');
          setTimeout(() => {
            habitElement.classList.remove('target-reached');
          }, 2000);
        }

        // Оновлюємо список звичок
        this.loadHabits();
      }
    } catch (error) {
      console.error('Error toggling habit completion:', error);
      const toast = await this.toastController.create({
        message: this.translateService.instant('HABITS.TOGGLE_ERROR'),
        duration: 2000,
        position: 'top',
        color: 'danger'
      });
      await toast.present();
    }
  }

  getHabitStatus(habit: Habit, date: Date): 'completed' | 'partial' | 'not_completed' {
    const dateStr = date.toISOString().split('T')[0];
    return habit.completionStatus[dateStr] || 'not_completed';
  }

  async activateHabit(habit: Habit) {
    await this.habitsService.activateHabit(habit.id);
    this.loadHabits();
  }

  async deactivateHabit(habit: Habit) {
    const alert = await this.alertController.create({
      header: this.translateService.instant('HABITS.DEACTIVATE_CONFIRMATION'),
      message: this.translateService.instant('HABITS.DEACTIVATE_MESSAGE'),
      buttons: [
        {
          text: this.translateService.instant('COMMON.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translateService.instant('HABITS.DEACTIVATE'),
          role: 'destructive',
          handler: () => {
            habit.isActive = false;
            this.habitsService.updateHabit(habit);
            this.loadHabits();
            this.presentToast(this.translateService.instant('HABITS.DEACTIVATED_SUCCESS'));
          }
        }
      ],
      backdropDismiss: false,
      cssClass: 'alert-dialog',
      keyboardClose: false,
      mode: 'md'
    });

    await alert.present();
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  isToday(date: Date): boolean {
    return date.toDateString() === this.today.toDateString();
  }

  getHabitIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'health': 'heart-outline',
      'fitness': 'footsteps-outline',
      'mindfulness': 'leaf-outline',
      'nutrition': 'ice-cream-outline',
      'learning': 'book-outline',
      'productivity': 'time-outline'
    };
    return icons[category] || 'checkmark-circle-outline';
  }

  getHabitColor(category: string): string {
    const colors: { [key: string]: string } = {
      'health': 'danger',
      'fitness': 'success',
      'mindfulness': 'primary',
      'nutrition': 'warning',
      'learning': 'tertiary',
      'productivity': 'secondary'
    };
    return colors[category] || 'medium';
  }

  getHabitProgress(habit: Habit): number {
    return habit.target > 0 ? habit.streak.current / habit.target : 0;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  hasActivity(date: Date): boolean {
    const dateStr = this.formatDate(date);
    return this.activeHabits.some(habit => {
      const status = habit.completionStatus[dateStr];
      return status === 'completed' || status === 'partial';
    });
  }

  selectDay(date: Date): void {
    this.selectedDate = date;
    this.generateCalendarDays();
  }

  goToNotifications() {
    // Навігація до сповіщень
  }

  goToBookmarks() {
    // Навігація до закладок
  }

  openCreateHabitModal() {
    this.isCreateHabitModalOpen = true;
    this.resetNewHabit();
  }

  closeCreateHabitModal() {
    this.isCreateHabitModalOpen = false;
    this.resetNewHabit();
  }

  resetNewHabit() {
    this.newHabit = {
      id: '',
      name: '',
      description: '',
      icon: 'checkmark-circle-outline',
      category: 'health',
      difficulty: 'easy',
      points: 10,
      target: 0,
      unit: '',
      frequency: 'daily',
      isActive: false,
      isChallengeHabit: false,
      completionStatus: {},
      streak: { current: 0, best: 0 },
      progress: {}
    };
  }

  async createHabit() {
    if (this.newHabit.name && this.newHabit.description) {
      const category = this.newHabit.category || 'health';
      const habit: Habit = {
        id: Date.now().toString(),
        name: this.newHabit.name,
        description: this.newHabit.description,
        icon: this.getHabitIcon(category),
        category: category,
        difficulty: this.newHabit.difficulty || 'easy',
        points: this.newHabit.points || 10,
        target: this.newHabit.target || 0,
        unit: this.newHabit.unit || '',
        frequency: this.newHabit.frequency || 'daily',
        isActive: false,
        isChallengeHabit: false,
        completionStatus: {},
        streak: { current: 0, best: 0 },
        progress: {}
      };

      await this.habitsService.createHabit(habit);
      this.closeCreateHabitModal();
      this.loadHabits();
    }
  }

  openEditHabitModal(habit: Habit) {
    if (!habit) return;

    this.editingHabit = {
      ...this.editingHabit,
      id: habit.id,
      name: habit.name || '',
      description: habit.description || '',
      icon: habit.icon || 'ellipse-outline',
      category: habit.category || 'health',
      difficulty: habit.difficulty || 'medium',
      points: habit.points || 0,
      isActive: habit.isActive || false,
      isChallengeHabit: habit.isChallengeHabit || false,
      isBaseHabit: habit.isBaseHabit || false,
      completionStatus: habit.completionStatus || {},
      streak: {
        current: habit.streak?.current || 0,
        best: habit.streak?.best || 0
      },
      target: habit.target || 1,
      unit: habit.unit || '',
      frequency: habit.frequency || 'daily',
      challengeId: habit.challengeId,
      reminder: habit.reminder,
      progress: habit.progress || {},
      createdAt: habit.createdAt,
      activationDate: habit.activationDate
    };
    this.isEditHabitModalOpen = true;
  }

  closeEditHabitModal() {
    this.isEditHabitModalOpen = false;
    this.editingHabit = {
      id: '',
      name: '',
      description: '',
      icon: 'ellipse-outline',
      category: 'health',
      difficulty: 'medium',
      points: 0,
      isActive: false,
      isChallengeHabit: false,
      isBaseHabit: false,
      completionStatus: {},
      streak: { current: 0, best: 0 },
      target: 1,
      unit: '',
      frequency: 'daily',
      progress: {}
    };
  }

  async updateHabit() {
    if (this.editingHabit) {
      await this.habitsService.updateHabit(this.editingHabit);
      this.loadHabits();
      this.closeEditHabitModal();
      this.presentToast(this.translateService.instant('HABITS.UPDATED_SUCCESS'));
    }
  }

  async deleteHabit(habit: Habit) {
    if (habit.isBaseHabit) {
      if (habit.isActive) {
        if (confirm('Ви впевнені, що хочете деактивувати цю базову звичку?')) {
          await this.deactivateHabit(habit);
        }
      }
      return; // Не дозволяємо видалити базову звичку
    }

    if (confirm('Ви впевнені, що хочете видалити цю звичку?')) {
      await this.habitsService.deleteHabit(habit.id);
      this.loadHabits();
    }
  }

  onDragStart(event: DragEvent, habit: Habit) {
    this.draggedHabit = habit;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragEnd(event: DragEvent) {
    this.draggedHabit = null;
  }

  onDragOver(event: DragEvent) {
    // Перевіряємо, чи можна викликати preventDefault
    if (event.cancelable) {
      event.preventDefault();
    }
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    return false; // Додаткова перевірка для старих браузерів
  }

  async onDrop(event: DragEvent, targetList: 'active' | 'available', targetHabit: Habit) {
    event.preventDefault();
    if (!this.draggedHabit) return;

    const sourceList = this.draggedHabit.isActive ? 'active' : 'available';
    if (sourceList === targetList) return;

    try {
      if (targetList === 'active') {
        await this.activateHabit(this.draggedHabit);
      } else {
        await this.deactivateHabit(this.draggedHabit);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
      await this.presentToast(this.translateService.instant('HABITS.DROP_ERROR'));
    }
  }
}
