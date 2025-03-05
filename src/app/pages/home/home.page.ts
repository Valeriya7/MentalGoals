import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UtilService } from 'src/app/services/util.service';
import { Preferences } from '@capacitor/preferences';
import { NavigationExtras } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { WishesService } from '../../services/wishes.service';
import { Subscription } from 'rxjs';
import { WishModalComponent } from '../../components/wish-modal/wish-modal.component';
//import { register } from 'swiper/element';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe]
})
export class HomePage implements OnInit, OnDestroy {
  userName: string = 'Sayli';
  weekDays: any[] = [];
  dailyTasks = [
    { name: 'No Sweets', icon: 'ice-cream-outline', completed: true },
    { name: 'No Coffee', icon: 'cafe-outline', completed: true },
    { name: '10min Exercise', icon: 'fitness-outline', completed: false },
    { name: '8000 Steps', icon: 'footsteps-outline', completed: false },
    { name: '5 English Words', icon: 'book-outline', completed: true }
  ];
  hasUnreadWish = false;
  currentWish = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    public util: UtilService,
    private wishesService: WishesService,
    private modalController: ModalController
  ) {
    this.generateWeekDays();
  }

  ngOnInit() {
    this.getUserData();
    this.subscriptions.push(
      this.wishesService.getHasUnreadWish().subscribe(hasUnread => {
        this.hasUnreadWish = hasUnread;
      }),
      this.wishesService.getCurrentWish().subscribe(wish => {
        this.currentWish = wish;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  generateWeekDays() {
    const today = new Date();
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      this.weekDays.push({
        name: dayNames[date.getDay()],
        date: date.getDate(),
        marked: i < 0 && Math.random() > 0.5, // Випадково відмічаємо минулі дні
        fullDate: date
      });
    }
  }

  isCurrentDay(date: number): boolean {
    return date === new Date().getDate();
  }

  goToCalendar() {
    this.router.navigate(['/tabs/habits']);
  }

  goToNotifications() {
    this.router.navigate(['/tabs/notifications']);
  }

  goToHabit(type: string) {
    this.router.navigate(['/tabs/habits'], {
      queryParams: { type: type }
    });
  }

  goToLifeWheel() {
    this.router.navigate(['/life-wheel']);
  }

  async getUserData() {
    const name = await Preferences.get({key: 'name'});
    if (name && name.value) {
      this.userName = name.value;
    }
    return name;
  }

  async showWish(): Promise<void> {
    if (this.hasUnreadWish) {
      await this.wishesService.markWishAsRead();
      this.hasUnreadWish = false;
    }

    const modal = await this.modalController.create({
      component: WishModalComponent,
      componentProps: {
        wish: this.currentWish
      },
      cssClass: 'half-modal',
      backdropDismiss: true
    });

    await modal.present();
  }
}
