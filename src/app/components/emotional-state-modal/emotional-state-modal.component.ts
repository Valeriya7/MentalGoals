import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { EmotionService } from '../../services/emotion.service';
import { Emotion } from '../../models/emotion.model';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  happyOutline,
  sadOutline,
  sunnyOutline,
  bedOutline,
  alertOutline,
  thunderstormOutline
} from 'ionicons/icons';
import { format } from "date-fns";

interface EmotionType {
  type: string;
  icon: string;
  color: string;
  label: string;
  value: number;
  energy: number;
}

@Component({
  selector: 'app-emotional-state-modal',
  templateUrl: './emotional-state-modal.component.html',
  styleUrls: ['./emotional-state-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule
  ]
})
export class EmotionalStateModalComponent implements OnInit {
  emotions: EmotionType[] = [
    { type: 'happy', icon: 'happy-outline', color: '#FFD93D', label: 'Happy', value: 8, energy: 8 },
    { type: 'calm', icon: 'sunny-outline', color: '#98D8AA', label: 'Calm', value: 7, energy: 6 },
    { type: 'tired', icon: 'bed-outline', color: '#B4E4FF', label: 'Tired', value: 4, energy: 3 },
    { type: 'anxious', icon: 'alert-outline', color: '#CBC3E3', label: 'Anxious', value: 3, energy: 7 },
    { type: 'sad', icon: 'sad-outline', color: '#FF6B6B', label: 'Sad', value: 2, energy: 4 },
    { type: 'angry', icon: 'thunderstorm-outline', color: '#FF6B6B', label: 'Angry', value: 2, energy: 8 }
  ];

  emotionForm: FormGroup;
  selectedEmotion: EmotionType | null = null;

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
    this.selectedEmotion = this.emotions.find(e => e.type === emotionType) || null;
    this.emotionForm.patchValue({ emotionType });
  }

  async saveEmotion() {
    try {
      if (this.selectedEmotion && this.emotionForm.valid) {
        const emotionData: Omit<Emotion, 'id' | 'createdAt'> = {
          type: this.selectedEmotion.type,
          note: this.emotionForm.value.note,
          date: new Date().toISOString(),
          icon: this.selectedEmotion.icon,
          color: this.selectedEmotion.color,
          value: this.selectedEmotion.value,
          energy: this.selectedEmotion.energy
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
        await this.emotionService.saveEmotion(emotionData);
        this.modalCtrl.dismiss({ saved: true });
        // Повертаємо дані для збереження в батьківському компоненті
        await this.modalCtrl.dismiss(emotionData);
      }
    } catch (error) {
      console.error('Error saving emotion:', error);
      await this.modalCtrl.dismiss(null, 'error');
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
