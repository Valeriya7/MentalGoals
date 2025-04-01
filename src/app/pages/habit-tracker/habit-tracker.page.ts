import { Component, OnInit, OnDestroy } from '@angular/core';
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
    streak: { current: 0, best: 0 }
  };

  constructor(
    private habitsService: HabitsService,
    private translateService: TranslateService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    this.generateCalendarDays();
  }

  ngOnInit() {
    this.loadHabits();
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
    const dateStr = date.toISOString().split('T')[0];

    // Перевіряємо поточний статус звички
    const currentStatus = habit.completionStatus[dateStr];

    // Якщо звичка вже відмічена як виконана, і користувач намагається відмітити її знову
    if (currentStatus === 'completed') {
      // Якщо користувач намагається змінити статус на 'not_completed', дозволяємо це
      if (status === 'not_completed') {
        await this.habitsService.toggleHabit(habit.id, dateStr, status);
      }
      // В іншому випадку ігноруємо спробу повторної відмітки
      return;
    }

    // Якщо звичка ще не відмічена або відмічена як 'partial'/'not_completed',
    // дозволяємо змінити її статус
    await this.habitsService.toggleHabit(habit.id, dateStr, status);
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
      streak: { current: 0, best: 0 }
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
        streak: { current: 0, best: 0 }
      };

      await this.habitsService.createHabit(habit);
      this.closeCreateHabitModal();
      this.loadHabits();
    }
  }

  openEditHabitModal(habit: Habit) {
    console.log('habit ', habit);
    this.editingHabit = JSON.parse(JSON.stringify(habit));
    console.log('this.editingHabit ', this.editingHabit);
    this.isEditHabitModalOpen = true;
  }

  closeEditHabitModal() {
    this.isEditHabitModalOpen = false;
    this.editingHabit = null;
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
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  async onDrop(event: DragEvent, targetList: 'active' | 'available', targetHabit: Habit) {
    event.preventDefault();

    if (!this.draggedHabit || this.draggedHabit === targetHabit) {
      return;
    }

    const sourceList = this.draggedHabit.isActive ? 'active' : 'available';

    if (sourceList === targetList) {
      return;
    }

    if (sourceList === 'active' && targetList === 'available') {
      await this.deactivateHabit(this.draggedHabit);
    } else if (sourceList === 'available' && targetList === 'active') {
      await this.activateHabit(this.draggedHabit);
    }

    this.loadHabits();
  }
}
