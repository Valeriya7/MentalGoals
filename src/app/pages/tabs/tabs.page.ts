import { Component, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { IonicModule, IonTabs } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import '../../utils/icons'; // Імпортуємо централізовану реєстрацію іконок

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, TranslatePipe]
})
export class TabsPage {
  @ViewChild(IonTabs) tabs!: IonTabs;

  constructor(private renderer: Renderer2) {}

  ionViewWillEnter() {
    // Видаляємо атрибут inert при активації вкладки
    const tabsElement = (this.tabs as any)?.nativeElement;
    if (tabsElement) {
      this.renderer.removeAttribute(tabsElement, 'inert');
      this.renderer.removeAttribute(tabsElement, 'aria-hidden');
    }
  }

  ionViewWillLeave() {
    // Додаємо атрибут inert при деактивації вкладки
    const tabsElement = (this.tabs as any)?.nativeElement;
    if (tabsElement) {
      // Перевіряємо, чи немає фокусу всередині елемента
      if (!tabsElement.contains(document.activeElement)) {
        this.renderer.setAttribute(tabsElement, 'inert', '');
      }
    }
  }
}
