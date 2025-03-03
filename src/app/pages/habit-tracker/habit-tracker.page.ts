import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-habit-tracker',
  templateUrl: './habit-tracker.page.html',
  styleUrls: ['./habit-tracker.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HabitTrackerPage implements OnInit {
  today = new Date();
  habits = [
    {
      id: 1,
      name: 'Ранкова медитація',
      target: 10,
      currentStreak: 5,
      bestStreak: 15,
      daysCompleted: []
    },
    {
      id: 2,
      name: 'Дихальні вправи',
      target: 5,
      currentStreak: 3,
      bestStreak: 7,
      daysCompleted: []
    }
  ];

  selectedDate = new Date();
  currentMonth: Date[] = [];

  constructor() {
    this.generateCalendarDays();
  }

  ngOnInit() { }

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

  toggleHabitCompletion(habit: any, date: Date) {
    const dateStr = date.toISOString().split('T')[0];
    const index = habit.daysCompleted.indexOf(dateStr);
    
    if (index === -1) {
      habit.daysCompleted.push(dateStr);
    } else {
      habit.daysCompleted.splice(index, 1);
    }
    
    this.updateStreak(habit);
  }

  updateStreak(habit: any) {
    // TODO: Implement streak calculation logic
  }

  isHabitCompleted(habit: any, date: Date): boolean {
    const dateStr = date.toISOString().split('T')[0];
    return habit.daysCompleted.includes(dateStr);
  }

  isToday(date: Date): boolean {
    return date.toDateString() === this.today.toDateString();
  }
} 