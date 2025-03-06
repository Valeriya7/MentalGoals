import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-life-wheel',
  templateUrl: './life-wheel.page.html',
  styleUrls: ['./life-wheel.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule]
})
export class LifeWheelPage implements OnInit {
  areas = [
    { key: 'LIFE_WHEEL.AREAS.HEALTH', value: 0 },
    { key: 'LIFE_WHEEL.AREAS.CAREER', value: 0 },
    { key: 'LIFE_WHEEL.AREAS.RELATIONSHIPS', value: 0 },
    { key: 'LIFE_WHEEL.AREAS.ENVIRONMENT', value: 0 },
    { key: 'LIFE_WHEEL.AREAS.PERSONAL_GROWTH', value: 0 },
    { key: 'LIFE_WHEEL.AREAS.FINANCES', value: 0 },
    { key: 'LIFE_WHEEL.AREAS.RECREATION', value: 0 },
    { key: 'LIFE_WHEEL.AREAS.SPIRITUALITY', value: 0 }
  ];

  constructor(private translateService: TranslateService) {}

  async ngOnInit() {
    // Ініціалізуємо переклади
    this.translateService.setDefaultLang('en');
    await this.translateService.use('en');
  }

  onSliderChange(event: any, area: any) {
    area.value = event.detail.value;
  }

  async saveResults() {
    // Тут буде логіка збереження результатів
    console.log('Results:', this.areas);
  }
} 