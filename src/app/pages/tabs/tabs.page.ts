import { Component, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { IonicModule, IonTabs } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import '../../utils/icons'; // Імпортуємо централізовану реєстрацію іконок

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, TranslateModule]
})
export class TabsPage {
  @ViewChild(IonTabs) tabs!: IonTabs;

  constructor(private renderer: Renderer2) {}

  ionViewWillEnter() {
    // Видаляємо атрибут inert при активації вкладки
    const tabsElement = (this.tabs as any)?.nativeElement;
    if (tabsElement) {
      // Видаляємо атрибути, які можуть заважати доступності
      this.renderer.removeAttribute(tabsElement, 'inert');
      this.renderer.removeAttribute(tabsElement, 'aria-hidden');
      
      // Додаємо правильні ARIA атрибути
      this.renderer.setAttribute(tabsElement, 'role', 'tablist');
      this.renderer.setAttribute(tabsElement, 'aria-label', 'Main navigation');
    }
  }

  ionViewWillLeave() {
    const tabsElement = (this.tabs as any)?.nativeElement;
    if (tabsElement) {
      // Перевіряємо, чи немає фокусу всередині елемента
      if (!tabsElement.contains(document.activeElement)) {
        // Замість aria-hidden використовуємо inert
        this.renderer.setAttribute(tabsElement, 'inert', '');
      }
    }
  }
}
