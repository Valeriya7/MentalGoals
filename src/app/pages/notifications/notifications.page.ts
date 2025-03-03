import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule]
})
export class NotificationsPage implements OnInit {
  notifications = [
    {
      id: 1,
      title: 'Час для медитації',
      message: 'Нагадування про вашу ранкову медитацію',
      time: '2 години тому',
      icon: 'leaf',
      read: false
    },
    {
      id: 2,
      title: 'Нова серія досягнень!',
      message: 'Ви виконували дихальні вправи 5 днів поспіль',
      time: '1 день тому',
      icon: 'trophy',
      read: true
    }
  ];

  constructor() { }

  ngOnInit() { }

  markAsRead(notification: any) {
    notification.read = true;
  }

  deleteNotification(notification: any) {
    this.notifications = this.notifications.filter(n => n.id !== notification.id);
  }
} 