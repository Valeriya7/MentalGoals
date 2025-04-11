import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { EmotionService } from '../../services/emotion.service';
import { Emotion } from '../../models/emotion.model';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { EmotionalStateModalComponent } from '../../components/emotional-state-modal/emotional-state-modal.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-emotional-calendar',
  templateUrl: './emotional-calendar.page.html',
  styleUrls: ['./emotional-calendar.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class EmotionalCalendarPage implements OnInit {
  currentDate: Date = new Date();
  selectedDate: Date = new Date();
  emotions: Emotion[] = [];
  monthEmotions: { [key: string]: Emotion } = {};

  constructor(
    private emotionService: EmotionService,
    private modalController: ModalController,
    private toastService: ToastService
  ) {}

  ngOnInit() {
   return  console.log('emotional-calendar: ');
    this.loadMonthEmotions();
  }

  async loadMonthEmotions() {
    try {
      const startOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
      const endOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);

      this.emotions = await this.emotionService.getEmotionsForPeriod(startOfMonth, endOfMonth);

      // Створюємо мапу емоцій по датах
      this.monthEmotions = {};
      this.emotions.forEach(emotion => {
        const date = new Date(emotion.date);
        const dateKey = format(date, 'yyyy-MM-dd');
        this.monthEmotions[dateKey] = emotion;
      });
    } catch (error) {
      console.error('Error loading emotions:', error);
    }
  }

  previousMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1);
    this.loadMonthEmotions();
  }

  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1);
    this.loadMonthEmotions();
  }

  getMonthTitle(): string {
    return format(this.currentDate, 'LLLL yyyy', { locale: uk });
  }

  getDaysInMonth(): Date[] {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Додаємо дні попереднього місяця
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }

    // Додаємо дні поточного місяця
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Додаємо дні наступного місяця
    const lastDayOfWeek = lastDay.getDay();
    for (let i = 1; i <= 7 - lastDayOfWeek; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  }

  getEmotionForDay(date: Date): Emotion | null {
    const dateKey = format(date, 'yyyy-MM-dd');
    return this.monthEmotions[dateKey] || null;
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentDate.getMonth();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  async openEmotionalStateModal() {
    const modal = await this.modalController.create({
      component: EmotionalStateModalComponent,
      componentProps: {
        date: this.selectedDate
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      try {
        await this.emotionService.addEmotion(data);
        await this.loadMonthEmotions();
        this.toastService.presentToast('Емоцію додано', 'success');
      } catch (error) {
        console.error('Error saving emotion:', error);
        this.toastService.presentToast('Помилка при збереженні емоції', 'danger');
      }
    }
  }

  selectDate(date: Date) {
    this.selectedDate = date;
    if (this.isCurrentMonth(date)) {
      this.openEmotionalStateModal();
    }
  }
}
