import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { EmotionService } from '../../services/emotion.service';
import { Emotion } from '../../models/emotion.model';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

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
    { type: 'happy', icon: 'happy-outline', color: 'success' },
    { type: 'sad', icon: 'sad-outline', color: 'warning' },
    { type: 'angry', icon: 'flash-outline', color: 'danger' },
    { type: 'anxious', icon: 'alert-outline', color: 'warning' },
    { type: 'calm', icon: 'leaf-outline', color: 'success' },
    { type: 'tired', icon: 'moon-outline', color: 'medium' }
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
        const emotionData: Omit<Emotion, 'id' | 'createdAt'> = {
          type: this.emotionForm.value.emotionType,
          note: this.emotionForm.value.note,
          date: new Date().toISOString(),
          icon: selectedEmotion.icon,
          color: selectedEmotion.color
        };
        
        try {
          await this.emotionService.saveEmotion(emotionData);
          await this.modalCtrl.dismiss(true);
        } catch (error) {
          console.error('Error saving emotion:', error);
        }
      }
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
} 