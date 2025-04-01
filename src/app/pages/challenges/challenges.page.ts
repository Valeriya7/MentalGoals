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
  closeCircleOutline,
  starOutline,
  starHalfOutline,
  star,
  chevronDownOutline,
  chevronUpOutline
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
  filteredChallenges: Challenge[] = [];
  selectedFilter: string = 'all';
  expandedChallenges = new Set<string>();
  expandedRewards = new Set<string>();
  difficultyColors = {
    'beginner': 'success',
    'intermediate': 'warning',
    'advanced': 'tertiary',
    'expert': 'danger'
  };

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
      'close-circle-outline': closeCircleOutline,
      'star-outline': starOutline,
      'star-half-outline': starHalfOutline,
      'star': star,
      'chevron-down-outline': chevronDownOutline,
      'chevron-up-outline': chevronUpOutline
    });
  }

  async ngOnInit() {
    await this.loadChallenges();
  }

  async loadChallenges() {
    try {
      this.challenges = await this.challengeService.getChallenges();
      console.log('Loaded challenges:', this.challenges);
      this.filterChallenges(this.selectedFilter);

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

  filterChallenges(filter: string) {
    this.selectedFilter = filter;

    switch (filter) {
      case 'active':
        this.filteredChallenges = this.challenges.filter(c => c.status === 'active');
        break;
      case 'completed':
        this.filteredChallenges = this.challenges.filter(c => c.status === 'completed');
        break;
      case 'available':
        this.filteredChallenges = this.challenges.filter(c => c.status === 'available');
        break;
      default:
        // Сортуємо челенджі так, щоб активні були вгорі, а завершені внизу
        this.filteredChallenges = [...this.challenges].sort((a, b) => {
          // Спочатку сортуємо за статусом
          const statusOrder: Record<string, number> = {
            'active': 0,
            'available': 1,
            'completed': 2,
            'failed': 3
          };
          const statusDiff = statusOrder[a.status] - statusOrder[b.status];
          
          if (statusDiff !== 0) {
            return statusDiff;
          }
          
          // Якщо статус однаковий, сортуємо за датою
          if (a.startDate && b.startDate) {
            return new Date(b.startDate).getTime() - new Date(a.startDate).getTime(); // Найновіші вгорі
          }
          
          return 0;
        });
    }
  }

  getDifficultyColor(difficulty: string): string {
    return this.difficultyColors[difficulty as keyof typeof this.difficultyColors] || 'medium';
  }

  getDifficultyLabel(difficulty: string): string {
    return `CHALLENGES.DIFFICULTY.${difficulty.toUpperCase()}`;
  }

  getProgressPercentage(challenge: Challenge): number {
    if (!challenge.tasks || challenge.tasks.length === 0) return 0;
    const completed = challenge.tasks.filter(task => task.completed).length;
    return Math.round((completed / challenge.tasks.length) * 100);
  }

  async startNewChallenge(type: string) {
    const success = await this.challengeService.startNewChallenge(type);
    if (success) {
      await this.loadChallenges();
    }
  }

  async activateChallenge(challenge: Challenge) {
    try {
      console.log("challenge: ", challenge);
      const success = await this.challengeService.activateChallenge(challenge.id);
      console.log("challenge: ", challenge);
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

  viewChallengeDetails(challenge: Challenge) {
    console.log("challenge: ", challenge);
    this.router.navigate(['/challenges', challenge.id]);
  }

  goToNotifications() {
    this.router.navigate(['/notifications']);
  }

  goToBookmarks() {
    this.router.navigate(['/bookmarks']);
  }

  getDifficultyIcon(difficulty: string): string {
    switch (difficulty) {
      case 'beginner':
        return 'star-outline';
      case 'intermediate':
        return 'star-half-outline';
      case 'advanced':
        return 'star';
      case 'expert':
        return 'trophy-outline';
      default:
        return 'star-outline';
    }
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

  toggleTasks(challenge: Challenge) {
    if (this.expandedChallenges.has(challenge.id)) {
      this.expandedChallenges.delete(challenge.id);
    } else {
      this.expandedChallenges.add(challenge.id);
    }
  }

  isExpanded(challenge: Challenge): boolean {
    return this.expandedChallenges.has(challenge.id);
  }

  toggleRewards(challenge: Challenge) {
    if (this.expandedRewards.has(challenge.id)) {
      this.expandedRewards.delete(challenge.id);
    } else {
      this.expandedRewards.add(challenge.id);
    }
  }

  isRewardsExpanded(challenge: Challenge): boolean {
    return this.expandedRewards.has(challenge.id);
  }
}
