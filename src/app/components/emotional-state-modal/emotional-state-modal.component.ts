import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { EmotionService } from '../../services/emotion.service';
import { Emotion } from '../../models/emotion.model';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  happyOutline,
  sadOutline,
  sunnyOutline,
  bedOutline,
  alertOutline,
  thunderstormOutline
} from 'ionicons/icons';
import {format} from "date-fns";

@Component({
  selector: 'app-emotional-state-modal',
  templateUrl: './emotional-state-modal.component.html',
  styleUrls: ['./emotional-state-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class EmotionalStateModalComponent implements OnInit {
  emotions = [
    { type: 'happy', icon: 'happy-outline', color: '#FFD93D', label: 'Щасливий' },
    { type: 'calm', icon: 'sunny-outline', color: '#98D8AA', label: 'Спокійний' },
    { type: 'tired', icon: 'bed-outline', color: '#B4E4FF', label: 'Втомлений' },
    { type: 'anxious', icon: 'alert-outline', color: '#CBC3E3', label: 'Тривожний' },
    { type: 'sad', icon: 'sad-outline', color: '#FF6B6B', label: 'Сумний' },
    { type: 'angry', icon: 'thunderstorm-outline', color: '#FF6B6B', label: 'Злий' }
  ];

  emotionForm: FormGroup;
  selectedEmotion: string | null = null;

  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder,
    private emotionService: EmotionService
  ) {
    this.emotionForm = this.fb.group({
      emotionType: ['', Validators.required],
      note: ['']
    });

    addIcons({
      'happy-outline': happyOutline,
      'sad-outline': sadOutline,
      'sunny-outline': sunnyOutline,
      'bed-outline': bedOutline,
      'alert-outline': alertOutline,
      'thunderstorm-outline': thunderstormOutline
    });
  }

  ngOnInit() {}

  selectEmotion(emotionType: string) {
    this.selectedEmotion = emotionType;
    this.emotionForm.patchValue({ emotionType });
  }

  async saveEmotion() {
    if (this.emotionForm.valid) {
      const selectedEmotion = this.emotions.find(e => e.type === this.emotionForm.value.emotionType);

      if (selectedEmotion) {
        const currentDate = new Date();
        const emotionData: Omit<Emotion, 'id' | 'createdAt'> = {
          type: this.emotionForm.value.emotionType,
          note: this.emotionForm.value.note,
          date: format(new Date(), 'yyyy-MM-dd'),
          icon: selectedEmotion.icon,
          color: selectedEmotion.color
        };

        console.log('Зберігаємо емоцію:', emotionData);

        try {
          // Додайте дані для індикації статусу закриття
          await this.modalCtrl.dismiss(emotionData, 'confirmed');
        } catch (error) {
          console.error('Error dismissing modal:', error);
          // Додайте обробку помилки для користувача
          // наприклад, показати повідомлення про помилку
        }
      } else {
        console.error('Обрана емоція не знайдена');
        // Додайте повідомлення для користувача
      }
    } else {
      console.error('Форма невалідна');
      // Покажіть помилки валідації користувачу
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
