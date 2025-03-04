import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-meditation',
  templateUrl: './meditation.page.html',
  styleUrls: ['./meditation.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class MeditationPage implements OnInit {
  meditations = [
    {
      id: 1,
      title: 'Ранкова медитація',
      duration: '10 хв',
      description: 'Почніть свій день з позитивною енергією',
      image: 'assets/images/morning-meditation.jpg'
    },
    {
      id: 2,
      title: 'Медитація для спокою',
      duration: '15 хв',
      description: 'Знайдіть внутрішній спокій та гармонію',
      image: 'assets/images/calm-meditation.jpg'
    },
    {
      id: 3,
      title: 'Вечірня медитація',
      duration: '20 хв',
      description: 'Розслабтеся перед сном',
      image: 'assets/images/evening-meditation.jpg'
    }
  ];

  constructor() { }

  ngOnInit() { }

  startMeditation(meditation: any) {
    console.log('Starting meditation:', meditation);
    // TODO: Implement meditation player
  }
} 