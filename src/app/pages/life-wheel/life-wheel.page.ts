import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '../../services/translate.service';
import { Preferences } from '@capacitor/preferences';
import { RangeChangeEventDetail } from '@ionic/core';
import { StorageService } from '../../services/storage.service';
import {Router} from "@angular/router";
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
interface LifeWheelArea {
  key: string;
  icon: string;
  value: number;
  isRated: boolean;
}

@Component({
  selector: 'app-life-wheel',
  templateUrl: './life-wheel.page.html',
  styleUrls: ['./life-wheel.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LifeWheelPage implements OnInit {
  public isDataSaved: boolean = false;
  public isAllAreasRated: boolean = false;
  public isEditing: boolean = false;

  public areas: LifeWheelArea[] = [
    { key: 'LIFE_WHEEL.AREAS.HEALTH', value: 0, icon: 'health', isRated: false },
    { key: 'LIFE_WHEEL.AREAS.CAREER', value: 0, icon: 'career', isRated: false },
    { key: 'LIFE_WHEEL.AREAS.FINANCE', value: 0, icon: 'finance', isRated: false },
    { key: 'LIFE_WHEEL.AREAS.FAMILY', value: 0, icon: 'family', isRated: false },
    { key: 'LIFE_WHEEL.AREAS.PERSONAL_GROWTH', value: 0, icon: 'personal-development', isRated: false },
    { key: 'LIFE_WHEEL.AREAS.SOCIAL_LIFE', value: 0, icon: 'social', isRated: false },
    { key: 'LIFE_WHEEL.AREAS.FRIENDS', value: 0, icon: 'friends', isRated: false },
    { key: 'LIFE_WHEEL.AREAS.SPIRITUALITY', value: 0, icon: 'spiritual', isRated: false }
  ];

  constructor(
    private navCtrl: NavController,
    private router: Router,
    public translateService: TranslateService,
    private toastController: ToastController,
    private storageService: StorageService
  ) {}

  async ngOnInit() {
    await this.loadSavedData();
  }

  async loadSavedData() {
    try {
      const { value } = await Preferences.get({ key: 'lifeWheelData' });
      if (value) {
        const parsedData = JSON.parse(value);
        this.areas = this.areas.map(area => ({
          ...area,
          value: parsedData[area.key] || 0,
          isRated: parsedData[area.key] ? true : false
        }));
        this.isDataSaved = true;
        this.checkAllAreasRated();
        console.log('Loaded saved data:', parsedData);
      } else {
        this.isDataSaved = false;
        this.checkAllAreasRated();
        console.log('No saved data found');
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
      this.isDataSaved = false;
      this.checkAllAreasRated();
    }
  }

  checkAllAreasRated() {
    const allRated = this.areas.every(area => area.isRated && area.value >= 1 && area.value <= 10);
    console.log('All areas rated:', allRated, this.areas);
    this.isAllAreasRated = allRated;
  }

  setAreaValue(area: LifeWheelArea, event: CustomEvent<RangeChangeEventDetail>) {
    console.log('Setting area value:', area.key, event);
    const value = typeof event.detail.value === 'number' ? event.detail.value : event.detail.value.upper;
    if (value >= 1 && value <= 10) {
      area.value = value;
      area.isRated = true;
      this.checkAllAreasRated();
      console.log('Area value updated:', area.key, area.value, area.isRated);
    }
  }

  async saveResults() {
    console.log('Saving results...', this.areas);
    if (!this.isAllAreasRated) {
      const toast = await this.toastController.create({
        message: this.translateService.instant('LIFE_WHEEL.NOT_ALL_RATED'),
        duration: 2000,
        color: 'warning',
        position: 'bottom'
      });
      await toast.present();
      return;
    }

    try {
      const dataToSave = this.areas.reduce((acc, area) => ({
        ...acc,
        [area.key]: area.value
      }), {});

      await Preferences.set({
        key: 'lifeWheelData',
        value: JSON.stringify(dataToSave)
      });

      this.isDataSaved = true;
      this.isEditing = false;
      console.log('Data saved successfully, isDataSaved:', this.isDataSaved);


      // Показуємо повідомлення про успішне збереження
      const toast = await this.toastController.create({
        message: this.translateService.instant('LIFE_WHEEL.SAVE_SUCCESS'),
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
      await toast.present();
    } catch (error) {
      console.error('Error saving data:', error);
      const toast = await this.toastController.create({
        message: this.translateService.instant('LIFE_WHEEL.SAVE_ERROR'),
        duration: 2000,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
    }
  }

  async resetData() {
    try {
      await Preferences.remove({ key: 'lifeWheelData' });
      this.areas = this.areas.map(area => ({ ...area, value: 0, isRated: false }));
      this.isDataSaved = false;
      this.isAllAreasRated = false;
      this.isEditing = false;
      this.checkAllAreasRated();

      const toast = await this.toastController.create({
        message: this.translateService.instant('LIFE_WHEEL.RESET_SUCCESS'),
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
      await toast.present();
    } catch (error) {
      console.error('Error resetting data:', error);
      const toast = await this.toastController.create({
        message: this.translateService.instant('LIFE_WHEEL.RESET_ERROR'),
        duration: 2000,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
    }
  }

  toggleEditMode() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.saveResults();
    }
  }

  createSegmentPath(level: number, isActive: boolean): string {
    const centerX = 200;
    const centerY = 200;
    const startRadius = 40 + (level * 16);
    const endRadius = startRadius + 14;
    const startAngle = -22.5;
    const endAngle = 22.5;

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

    return `M ${x1} ${y1} L ${x2} ${y2} A ${endRadius} ${endRadius} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${startRadius} ${startRadius} 0 0 0 ${x1} ${y1} Z`;
  }

  getSegmentColor(index: number, isActive: boolean): string {
    const colors = [
      '#ea7171', // Health
      '#a2efa2', // Career
      '#b266b9', // Finances
      '#76a276', // Family
      '#3357FF', // Personal Development
      '#ec95eb', // Social Life
      '#7dc6e8', // Friends
      '#FFB533'  // Spiritual
    ];
    return isActive ? colors[index] : `${colors[index]}33`;
  }

  onRangeChange(area: LifeWheelArea, event: CustomEvent<RangeChangeEventDetail>) {
    const value = typeof event.detail.value === 'number' ? event.detail.value : event.detail.value.upper;
    if (value >= 1 && value <= 10) {
      area.value = value;
    }
  }

  getIconX(index: number): number {
    const radius = 200;
    const angle = (index * 45 - 90) * Math.PI / 180;
    return 190 + radius * Math.cos(angle);
  }

  getIconY(index: number): number {
    const radius = 210;
    const angle = (index * 45 - 90) * Math.PI / 180;
    return 190 + radius * Math.sin(angle) - 15;
  }

  getLabelX(index: number, indexX: number): number {
    const radius = 160;
    const angle = (index * 45 - 90) * Math.PI / 180;
    return 190 + radius * Math.cos(angle) + indexX;
  }

  getLabelY(index: number, indexY: number): number {
    const radius = 210;
    const angle = (index * 45 - 90) * Math.PI / 180;
    return 190 + radius * Math.sin(angle) + indexY;
  }

  getLabelAnchor(index: number): string {
    if (index === 0 || index === 4) return 'middle';
    return index < 4 ? 'start' : 'end';
  }

  onSegmentClick(area: LifeWheelArea, level: number) {
    if (this.isEditing) {
      this.setAreaValue(area, { detail: { value: level } } as CustomEvent<RangeChangeEventDetail>);
    }
  }

  close(){
    this.router.navigate(['/tabs/home']);
  }
}

