import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  trophyOutline, 
  giftOutline,
  informationCircleOutline,
  iceCreamOutline,
  cafeOutline,
  fitnessOutline,
  footstepsOutline,
  bookOutline,
  checkmarkCircle,
  addCircleOutline
} from 'ionicons/icons';
import { ChallengeService } from '../../services/challenge.service';

@Component({
  selector: 'app-challenges',
  templateUrl: './challenges.page.html',
  styleUrls: ['./challenges.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ChallengesPage implements OnInit {
  currentChallenge = {
    id: 1,
    name: '40 Днів Здорових Звичок',
    currentDay: 15,
    totalDays: 40,
    tasks: [
      {
        name: 'Без солодкого',
        description: 'Уникайте солодощів протягом дня',
        icon: 'ice-cream-outline',
        completed: true
      },
      {
        name: 'Без кави',
        description: 'Замініть каву на здорові альтернативи',
        icon: 'cafe-outline',
        completed: true
      },
      {
        name: '10 хвилин вправ',
        description: 'Виконайте комплекс вправ',
        icon: 'fitness-outline',
        completed: false
      },
      {
        name: '8000 кроків',
        description: 'Пройдіть мінімум 8000 кроків',
        icon: 'footsteps-outline',
        completed: false
      },
      {
        name: '5 англійських слів',
        description: 'Вивчіть нові слова',
        icon: 'book-outline',
        completed: true
      }
    ],
    rewards: {
      points: 40,
      discounts: [
        { brand: 'Adidas', amount: '15%' },
        { brand: 'Garmin', amount: '15%' },
        { brand: 'Nike', amount: '15$' }
      ]
    }
  };

  constructor(
    private challengeService: ChallengeService
  ) {
    addIcons({
      'trophy-outline': trophyOutline,
      'gift-outline': giftOutline,
      'information-circle-outline': informationCircleOutline,
      'ice-cream-outline': iceCreamOutline,
      'cafe-outline': cafeOutline,
      'fitness-outline': fitnessOutline,
      'footsteps-outline': footstepsOutline,
      'book-outline': bookOutline,
      'checkmark-circle': checkmarkCircle,
      'add-circle-outline': addCircleOutline
    });
  }

  ngOnInit() {
    this.challengeService.getActiveChallenge().subscribe(challenge => {
      console.log('Active challenge:', challenge);
    });
  }

  async startChallenge(type: string) {
    await this.challengeService.startNewChallenge(type);
  }
}
