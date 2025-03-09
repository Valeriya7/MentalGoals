import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Preferences } from '@capacitor/preferences';

interface LifeWheelArea {
  key: string;
  value: number;
  icon: string;
}

@Component({
  selector: 'app-life-wheel',
  templateUrl: './life-wheel.page.html',
  styleUrls: ['./life-wheel.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule]
})
export class LifeWheelPage implements OnInit {
  areas: LifeWheelArea[] = [
    { key: 'LIFE_WHEEL.AREAS.HEALTH', value: 0, icon: 'health' },
    { key: 'LIFE_WHEEL.AREAS.CAREER', value: 0, icon: 'career' },
    { key: 'LIFE_WHEEL.AREAS.FINANCES', value: 0, icon: 'finance' },
    { key: 'LIFE_WHEEL.AREAS.FAMILY', value: 0, icon: 'family' },
    { key: 'LIFE_WHEEL.AREAS.PERSONAL_GROWTH', value: 0, icon: 'personal-development' },
    { key: 'LIFE_WHEEL.AREAS.SOCIAL_LIFE', value: 0, icon: 'social' },
    { key: 'LIFE_WHEEL.AREAS.FRIENDS', value: 0, icon: 'friends' },
    { key: 'LIFE_WHEEL.AREAS.SPIRITUALITY', value: 0, icon: 'spiritual' }
  ];

  constructor(private translateService: TranslateService) {}

  async ngOnInit() {
    // Ініціалізуємо переклади
    this.translateService.setDefaultLang('en');
    await this.translateService.use('en');

    // Завантажуємо збережені дані
    await this.loadSavedData();
  }

  createSegmentPath(level: number, isActive: boolean): string {
    const centerX = 200;
    const centerY = 200;
    const startRadius = 40 + (level * 16); // Збільшуємо радіус для кожного рівня
    const endRadius = startRadius + 14; // Ширина сегмента
    const startAngle = -20; // Початковий кут сегмента (в градусах)
    const endAngle = 20; // Кінцевий кут сегмента (в градусах)

    const startRadians = (startAngle * Math.PI) / 180;
    const endRadians = (endAngle * Math.PI) / 180;

    const x1 = centerX + startRadius * Math.cos(startRadians);
    const y1 = centerY + startRadius * Math.sin(startRadians);
    const x2 = centerX + endRadius * Math.cos(startRadians);
    const y2 = centerY + endRadius * Math.sin(startRadians);
    const x3 = centerX + endRadius * Math.cos(endRadians);
    const y3 = centerY + endRadius * Math.sin(endRadians);
    const x4 = centerX + startRadius * Math.cos(endRadians);
    const y4 = centerY + startRadius * Math.sin(endRadians);

    return `M ${x1} ${y1} L ${x2} ${y2} A ${endRadius} ${endRadius} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${startRadius} ${startRadius} 0 0 0 ${x1} ${y1}`;
  }

  getSegmentColor(index: number, isActive: boolean): string {
    const colors = [
      '#b266b9', // Finances
      '#76a276', // Family
      '#3357FF', // Personal Development
      '#ec95eb', // Social Life
      '#7dc6e8', // FRIENDS
      '#FFB533', // Spiritual
      '#ea7171', // Health
      '#a2efa2'  // Career
    ];
    return isActive ? colors[index] : `${colors[index]}33`;
  }

  setAreaValue(area: LifeWheelArea, value: number) {
    area.value = value;
  }

  getIconX(index: number): number {
    const radius = 200;
    const angle = (index * 45 - 90) * Math.PI / 180;
    return 200 + radius * Math.cos(angle) - 25;
  }

  getIconY(index: number): number {
    const radius = 200;
    const angle = (index * 45 - 90) * Math.PI / 180;
    return 200 + radius * Math.sin(angle) - 27;
  }

  getLabelX(index: number): number {
    const radius = 230;
    const angle = (index * 45 - 90) * Math.PI / 180;
    return 200 + radius * Math.cos(angle);
  }

  getLabelY(index: number): number {
    const radius = 230;
    const angle = (index * 45 - 90) * Math.PI / 180;
    return 200 + radius * Math.sin(angle);
  }

  getLabelAnchor(index: number): string {
    if (index === 0 || index === 4) return 'middle';
    return index < 4 ? 'start' : 'end';
  }

  async loadSavedData() {
    try {
      const { value } = await Preferences.get({ key: 'lifeWheelData' });
      if (value) {
        const savedData = JSON.parse(value);
        this.areas = this.areas.map(area => ({
          ...area,
          value: savedData[area.key] || 0
        }));
      }
    } catch (error) {
      console.error('Error loading life wheel data:', error);
    }
  }

  async saveResults() {
    try {
      const dataToSave = this.areas.reduce((acc, area) => ({
        ...acc,
        [area.key]: area.value
      }), {});

      await Preferences.set({
        key: 'lifeWheelData',
        value: JSON.stringify(dataToSave)
      });

      // Показуємо повідомлення про успішне збереження
      const toast = document.createElement('ion-toast');
      toast.message = await this.translateService.get('LIFE_WHEEL.SAVE_SUCCESS').toPromise();
      toast.duration = 2000;
      toast.color = 'success';
      document.body.appendChild(toast);
      toast.present();
    } catch (error) {
      console.error('Error saving life wheel data:', error);
      // Показуємо повідомлення про помилку
      const toast = document.createElement('ion-toast');
      toast.message = await this.translateService.get('LIFE_WHEEL.SAVE_ERROR').toPromise();
      toast.duration = 2000;
      toast.color = 'danger';
      document.body.appendChild(toast);
      toast.present();
    }
  }
}
