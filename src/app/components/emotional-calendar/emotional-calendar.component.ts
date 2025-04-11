import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { EmotionalStateModalComponent } from '../emotional-state-modal/emotional-state-modal.component';
import { EmotionalStateService } from '../../services/emotional-state.service';
import { EmotionService } from '../../services/emotion.service';
import { Emotion } from '../../models/emotion.model';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  emotion?: Emotion;
}

@Component({
  selector: 'app-emotional-calendar',
  templateUrl: './emotional-calendar.component.html',
  styleUrls: ['./emotional-calendar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class EmotionalCalendarComponent implements OnInit {
  @Input() emotions: Emotion[] = [];
  
  currentDate: Date = new Date();
  calendarDays: CalendarDay[] = [];
  weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
  
  constructor(
    private modalController: ModalController,
    private emotionalStateService: EmotionalStateService,
    private emotionService: EmotionService
  ) {}

  ngOnInit() {
    this.loadEmotions();
    this.generateCalendar();
  }

  private async loadEmotions() {
    this.emotions = await this.emotionService.getEmotions();
  }

  private generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Отримуємо перший день місяця
    const firstDay = new Date(year, month, 1);
    // Отримуємо останній день місяця
    const lastDay = new Date(year, month + 1, 0);
    
    // Отримуємо день тижня першого дня місяця (0 - неділя, 1 - понеділок, ...)
    const firstDayOfWeek = firstDay.getDay() || 7; // Перетворюємо 0 (неділю) в 7
    
    // Створюємо масив днів календаря
    this.calendarDays = [];
    
    // Додаємо дні попереднього місяця
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i > 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i + 1);
      this.calendarDays.push({
        date,
        dayNumber: prevMonthLastDay - i + 1
      });
    }
    
    // Додаємо дні поточного місяця
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      const emotion = this.emotions.find(e => {
        const emotionDate = new Date(e.date);
        return emotionDate.toDateString() === date.toDateString();
      });
      
      this.calendarDays.push({
        date,
        dayNumber: i,
        emotion
      });
    }
    
    // Додаємо дні наступного місяця
    const remainingDays = 42 - this.calendarDays.length; // 6 рядків * 7 днів = 42
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      this.calendarDays.push({
        date,
        dayNumber: i
      });
    }
  }

  getMonthName(): string {
    const months = [
      'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
      'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
    ];
    return months[this.currentDate.getMonth()];
  }

  getYear(): number {
    return this.currentDate.getFullYear();
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentDate.getMonth() &&
           date.getFullYear() === this.currentDate.getFullYear();
  }

  getEmotionIcon(emotion: Emotion): string {
    return emotion.icon;
  }

  getEmotionColor(emotion: Emotion): string {
    return emotion.color;
  }

  previousMonth() {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      1
    );
    this.generateCalendar();
  }

  nextMonth() {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      1
    );
    this.generateCalendar();
  }

  async openEmotionalStateModal(day: CalendarDay) {
    const modal = await this.modalController.create({
      component: EmotionalStateModalComponent,
      componentProps: {
        date: day.date
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      await this.emotionService.saveEmotion(data);
      await this.loadEmotions();
      this.generateCalendar();
    }
  }
} 