import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { WishService } from '../../services/wish.service';
import { Wish } from '../../interfaces/wish.interface';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-daily-wish',
  templateUrl: './daily-wish.component.html',
  styleUrls: ['./daily-wish.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class DailyWishComponent implements OnInit {
  currentWish: Wish | null = null;
  selectedLanguage: 'uk' | 'en' | 'de' = 'uk';

  constructor(
    private wishService: WishService,
    private modalCtrl: ModalController
  ) {}

  async ngOnInit() {
    await this.loadDailyWish();
  }

  async loadDailyWish() {
    this.currentWish = await this.wishService.getDailyWish();
  }

  getWishText(): string {
    if (!this.currentWish) return '';
    return this.currentWish[this.selectedLanguage];
  }

  changeLanguage(lang: 'uk' | 'en' | 'de') {
    this.selectedLanguage = lang;
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
} 