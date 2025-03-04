import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicModule, IonContent } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslateService } from '../../services/translate.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-life-wheel',
  templateUrl: './life-wheel.page.html',
  styleUrls: ['./life-wheel.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe]
})
export class LifeWheelPage {
  @ViewChild(IonContent) content!: IonContent;

  constructor(private translateService: TranslateService) {}

  async ionViewWillEnter() {
    // Чекаємо завантаження перекладів
    await firstValueFrom(this.translateService.isTranslationsLoaded());
    
    // Видаляємо aria-hidden з контенту при активації сторінки
    setTimeout(() => {
      const contentElement = (this.content as any)?.nativeElement;
      if (contentElement) {
        contentElement.removeAttribute('aria-hidden');
      }
    }, 100);
  }

  ionViewWillLeave() {
    // Перевіряємо, чи немає фокусу всередині контенту перед встановленням aria-hidden
    const contentElement = (this.content as any)?.nativeElement;
    if (contentElement && !contentElement.contains(document.activeElement)) {
      contentElement.setAttribute('aria-hidden', 'true');
    }
  }
} 