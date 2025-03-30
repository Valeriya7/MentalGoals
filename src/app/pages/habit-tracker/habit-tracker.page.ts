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

@Component({
  selector: 'app-habit-tracker',
  templateUrl: './habit-tracker.page.html',
  styleUrls: ['./habit-tracker.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, TranslateModule]
})
export class HabitTrackerPage implements OnInit, OnDestroy {
  today = new Date();
  selectedDate = new Date();
  currentMonth: Date[] = [];
  activeHabits: Habit[] = [];
  availableHabits: Habit[] = [];
  private habitsSubscription?: Subscription;

  constructor(private habitsService: HabitsService) {
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
    console.log('Loading habits...');
    this.habitsSubscription = this.habitsService.getActiveHabits().subscribe(habits => {
      console.log('Received active habits:', habits);
      this.activeHabits = habits;
      this.generateCalendarDays(); // Оновлюємо календар після завантаження звичок
    });

    this.habitsService.getAvailableHabits().subscribe(habits => {
      console.log('Received available habits:', habits);
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

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  hasActivity(date: Date): boolean {
    const dateStr = this.formatDate(date);
    console.log('Checking activity for date:', dateStr);
    console.log('Active habits:', this.activeHabits);
    
    const hasActivity = this.activeHabits.some(habit => {
      const status = habit.completionStatus[dateStr];
      console.log(`Habit ${habit.name} status for ${dateStr}:`, status);
      return status === 'completed' || status === 'partial';
    });
    
    console.log('Has activity:', hasActivity);
    return hasActivity;
  }

  async toggleHabitCompletion(habit: Habit, date: Date, status: 'completed' | 'partial' | 'not_completed') {
    const dateStr = this.formatDate(date);
    console.log('Toggling habit completion:', {
      habit: habit.name,
      date: dateStr,
      status: status
    });
    
    await this.habitsService.toggleHabit(habit.id, dateStr, status);
    habit.completionStatus[dateStr] = status;
    console.log('Updated habit status:', habit.completionStatus);
    
    this.generateCalendarDays();
  }

  getHabitStatus(habit: Habit, date: Date): 'completed' | 'partial' | 'not_completed' {
    const dateStr = this.formatDate(date);
    return habit.completionStatus[dateStr] || 'not_completed';
  }

  async activateHabit(habit: Habit) {
    await this.habitsService.activateHabit(habit.id);
  }

  async deactivateHabit(habit: Habit) {
    await this.habitsService.deactivateHabit(habit.id);
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

  goToNotifications() {
    // Навігація до сповіщень
  }

  goToBookmarks() {
    // Навігація до закладок
  }

  selectDay(date: Date) {
    this.selectedDate = date;
    this.generateCalendarDays();
  }
} 