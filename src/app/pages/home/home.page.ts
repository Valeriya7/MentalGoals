import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UtilService } from 'src/app/services/util.service';
import { Preferences } from '@capacitor/preferences';
import { NavigationExtras } from '@angular/router';
//import { register } from 'swiper/element';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HomePage implements OnInit {
  userName: string = 'Sayli';
  weekDays: any[] = [];
  dailyTasks = [
    { name: 'No Sweets', icon: 'ice-cream-outline', completed: true },
    { name: 'No Coffee', icon: 'cafe-outline', completed: true },
    { name: '10min Exercise', icon: 'fitness-outline', completed: false },
    { name: '8000 Steps', icon: 'footsteps-outline', completed: false },
    { name: '5 English Words', icon: 'book-outline', completed: true }
  ];

  constructor(
    private router: Router,
    public util: UtilService
  ) {
    this.generateWeekDays();
  }

  ngOnInit() {
    this.getUserData();
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

  goToBookmarks() {
    // Implement bookmarks navigation
  }

  goToHabit(type: string) {
    this.router.navigate(['/tabs/habits'], {
      queryParams: { type: type }
    });
  }

  async getUserData() {
    const name = await Preferences.get({key: 'name'});
    if (name && name.value) {
      this.userName = name.value;
    }
    return name;
  }
}
