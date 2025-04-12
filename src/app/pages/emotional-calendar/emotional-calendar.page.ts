import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { EmotionService } from '../../services/emotion.service';
import { Emotion } from '../../models/emotion.model';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { EmotionalStateModalComponent } from '../../components/emotional-state-modal/emotional-state-modal.component';
import { ToastService } from '../../services/toast.service';
import { addIcons } from 'ionicons';
import {
  happyOutline,
  sadOutline,
  sunnyOutline,
  bedOutline,
  alertOutline,
  thunderstormOutline,
  closeOutline
} from 'ionicons/icons';

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
  private emotionCache: { [key: string]: Emotion | null } = {};

  constructor(
    private emotionService: EmotionService,
    private modalController: ModalController,
    private toastService: ToastService
  ) {
    addIcons({
      'happy-outline': happyOutline,
      'sad-outline': sadOutline,
      'sunny-outline': sunnyOutline,
      'bed-outline': bedOutline,
      'alert-outline': alertOutline,
      'thunderstorm-outline': thunderstormOutline,
      'close-outline': closeOutline
    });
  }

  ngOnInit() {
    console.log('emotional-calendar: ');
    this.loadMonthEmotions2();
  }
  async loadMonthEmotions2() {
    try {
      const startOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
      const endOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);

      // Отримуємо емоції за період
      this.emotions = await this.emotionService.getEmotionsForPeriod(startOfMonth, endOfMonth);
      console.log('Отримані емоції за період:', this.emotions);

      // Очищуємо попередні емоції та кеш
      this.monthEmotions = {};
      this.emotionCache = {};

      // Зберігаємо емоції в мапу за датами
      if (this.emotions && this.emotions.length > 0) {
        this.emotions.forEach(emotion => {
          if (emotion && emotion.date) {
            const date = new Date(emotion.date);
            const dateKey = format(date, 'yyyy-MM-dd');
            this.monthEmotions[dateKey] = {
              ...emotion,
              date: date.toISOString()
            };
          }
        });
      }

      console.log('Мапа емоцій за місяць:', this.monthEmotions);
    } catch (error) {
      console.error('Помилка при завантаженні емоцій:', error);
      this.toastService.presentToast('Помилка при завантаженні емоцій', 'danger');
      this.emotions = [];
      this.monthEmotions = {};
      this.emotionCache = {};
    }
  }
  async loadMonthEmotions() {
    try {
      const startOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
      const endOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);

      // Отримуємо емоції за період
      this.emotions = await this.emotionService.getEmotionsForPeriod(startOfMonth, endOfMonth);
      console.log('Отримані емоції за період:', this.emotions);

      // Очищуємо попередні емоції та кеш
      this.monthEmotions = {};
      this.emotionCache = {};

      // Зберігаємо емоції в мапу за датами
      if (this.emotions && this.emotions.length > 0) {
        this.emotions.forEach(emotion => {
          if (emotion && emotion.date) {
            const date = new Date(emotion.date);
            const dateKey = format(date, 'yyyy-MM-dd');
            this.monthEmotions[dateKey] = emotion;
          }
        });
      }

      // Оновлюємо емоцію для вибраного дня
      if (this.selectedDate) {
        const selectedDateKey = format(this.selectedDate, 'yyyy-MM-dd');
        const updatedEmotion = this.monthEmotions[selectedDateKey];
        if (updatedEmotion) {
          // Оновлюємо кеш для вибраного дня
          this.emotionCache[selectedDateKey] = updatedEmotion;
        }
      }

      console.log('Мапа емоцій за місяць:', this.monthEmotions);
    } catch (error) {
      console.error('Помилка при завантаженні емоцій:', error);
      this.toastService.presentToast('Помилка при завантаженні емоцій', 'danger');
      this.emotions = [];
      this.monthEmotions = {};
      this.emotionCache = {};
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
    const firstDayOfWeek = firstDay.getDay() || 7; // Якщо 0 (неділя), то 7
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = prevMonth.getDate();

    for (let i = firstDayOfWeek - 1; i > 0; i--) {
      days.push(new Date(year, month - 1, daysInPrevMonth - i + 1));
    }

    // Додаємо дні поточного місяця
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Додаємо дні наступного місяця
    const lastDayOfWeek = lastDay.getDay() || 7;
    const daysToAdd = 7 - lastDayOfWeek;

    for (let i = 1; i <= daysToAdd; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  }

  getEmotionForDay(date: Date): Emotion | null {
    try {
      const dateKey = format(date, 'yyyy-MM-dd');

      // Перевіряємо кеш
      if (this.emotionCache[dateKey] !== undefined) {
        return this.emotionCache[dateKey];
      }

      // Отримуємо емоцію та зберігаємо в кеш
      const emotion = this.monthEmotions[dateKey] || null;
      this.emotionCache[dateKey] = emotion;

      return emotion;
    } catch (error) {
      console.error('Помилка при отриманні емоції для дня:', error);
      return null;
    }
  }

  isCurrentMonth(date: Date): boolean {
    if (!date) return false;
    return date.getMonth() === this.currentDate.getMonth() &&
           date.getFullYear() === this.currentDate.getFullYear();
  }

  isToday(date: Date): boolean {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  async openEmotionalStateModal() {
    try {
      const modal = await this.modalController.create({
        component: EmotionalStateModalComponent,
        componentProps: {
          date: this.selectedDate
        }
      });

      await modal.present();

      const { data } = await modal.onDidDismiss();

      if (data) {
        try {
          await this.emotionService.addEmotion(data);
          
          // Оновлюємо дані календаря
          await this.loadMonthEmotions();
          
          // Очищуємо кеш для вибраного дня, щоб оновити відображення
          const selectedDateKey = format(this.selectedDate, 'yyyy-MM-dd');
          delete this.emotionCache[selectedDateKey];
          
          this.toastService.presentToast('Емоцію додано', 'success');
        } catch (error) {
          console.error('Error saving emotion:', error);
          this.toastService.presentToast('Помилка при збереженні емоції', 'danger');
        }
      }
    } catch (modalError) {
      console.error('Error creating or presenting modal:', modalError);
      this.toastService.presentToast('Помилка при відкритті вікна', 'danger');
    }
  }
  selectDate(date: Date) {
    if (!date) return;
    
    const newDate = new Date(date);
    this.selectedDate = newDate;

    // Перевіряємо чи це сьогоднішній день
    const today = new Date();
    const isToday = newDate.getDate() === today.getDate() &&
                    newDate.getMonth() === today.getMonth() &&
                    newDate.getFullYear() === today.getFullYear();

    // Відкриваємо модальне вікно тільки якщо це поточний місяць і сьогоднішній день
    if (this.isCurrentMonth(newDate) && isToday) {
      this.openEmotionalStateModal();
    }
  }

  trackByDate(index: number, date: Date): string {
    return date.toISOString();
  }
}
