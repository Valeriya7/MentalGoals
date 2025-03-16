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
  calendarOutline,
  notificationsOutline,
  bookmarkOutline,
  timeOutline,
  shirtOutline,
  watchOutline,
  storefront,
  closeCircleOutline
} from 'ionicons/icons';
import { ChallengeService } from '../../services/challenge.service';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Challenge } from '../../interfaces/challenge.interface';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-challenges',
  templateUrl: './challenges.page.html',
  styleUrls: ['./challenges.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, TranslateModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ChallengesPage implements OnInit {
  challenges: Challenge[] = [];

  constructor(
    private challengeService: ChallengeService,
    private router: Router
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
      'calendar-outline': calendarOutline,
      'notifications-outline': notificationsOutline,
      'bookmark-outline': bookmarkOutline,
      'time-outline': timeOutline,
      'shirt-outline': shirtOutline,
      'watch-outline': watchOutline,
      'storefront': storefront,
      'gift': giftOutline,
      'close-circle-outline': closeCircleOutline
    });
  }

  async ngOnInit() {
    await this.loadChallenges();
  }

  async loadChallenges() {
    try {
      this.challenges = await this.challengeService.getChallenges();
      console.log('Loaded challenges:', this.challenges);
      
      // Перевірка наявності завдань у активному челенджі
      const activeChallenge = this.challenges.find(c => c.status === 'active');
      if (activeChallenge) {
        console.log('Active challenge:', activeChallenge);
        console.log('Active challenge tasks:', activeChallenge.tasks);
        if (!activeChallenge.tasks || activeChallenge.tasks.length === 0) {
          console.warn('No tasks found in active challenge');
        }
      } else {
        console.log('No active challenge found');
      }
    } catch (error) {
      console.error('Error loading challenges:', error);
    }
  }

  async startNewChallenge(type: string) {
    const success = await this.challengeService.startNewChallenge(type);
    if (success) {
      await this.loadChallenges();
    }
  }

  async activateChallenge(challenge: Challenge) {
    try {
      const success = await this.challengeService.activateChallenge(challenge.id);
      if (success) {
        await this.loadChallenges();
        console.log('Challenge activated successfully:', challenge.id);
      } else {
        console.warn('Failed to activate challenge:', challenge.id);
      }
    } catch (error) {
      console.error('Error activating challenge:', error);
    }
  }

  goToChallenge(challenge: Challenge) {
    this.router.navigate(['/challenge-details', challenge.id]);
  }

  goToNotifications() {
    this.router.navigate(['/notifications']);
  }

  goToBookmarks() {
    this.router.navigate(['/bookmarks']);
  }

  getPartnerIcon(brand: string): string {
    const icons: { [key: string]: string } = {
      'Adidas': 'storefront',
      'Nike': 'storefront',
      'Garmin': 'watch-outline',
      'Under Armour': 'shirt-outline'
    };
    return icons[brand] || 'gift-outline';
  }

  getDiscountColor(amount: string): string {
    if (amount.includes('%')) {
      const percentage = parseInt(amount);
      if (percentage >= 30) return 'success';
      if (percentage >= 20) return 'warning';
      return 'primary';
    }
    if (amount.includes('$')) {
      const value = parseInt(amount);
      if (value >= 50) return 'success';
      if (value >= 25) return 'warning';
      return 'primary';
    }
    return 'medium';
  }

  async deactivateAllChallenges() {
    try {
      const success = await this.challengeService.deactivateAllChallenges();
      if (success) {
        await this.loadChallenges();
        console.log('All challenges deactivated successfully');
      } else {
        console.warn('Failed to deactivate challenges');
      }
    } catch (error) {
      console.error('Error deactivating challenges:', error);
    }
  }
}
