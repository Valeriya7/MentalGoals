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
    await this.habitsService.toggleHabit(habit.id, dateStr, status);
  }

  getHabitStatus(habit: Habit, date: Date): 'completed' | 'partial' | 'not_completed' {
    const dateStr = date.toISOString().split('T')[0];
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
} 