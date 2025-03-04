import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-wish-modal',
  templateUrl: './wish-modal.component.html',
  styleUrls: ['./wish-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class WishModalComponent implements OnInit {
  @Input() wish: string = '';

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    // Встановлюємо фокус на кнопку закриття при відкритті модального вікна
    setTimeout(() => {
      const closeButton = document.querySelector('.close-button') as HTMLElement;
      if (closeButton) {
        closeButton.focus();
      }
    }, 100);
  }

  dismiss(): void {
    this.modalController.dismiss();
  }
} 