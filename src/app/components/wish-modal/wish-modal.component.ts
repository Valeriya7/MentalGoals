import { Component, Input, OnInit, AfterViewInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ModalService } from '../../services/modal.service';
import { addIcons } from 'ionicons';
import { closeOutline, heartOutline } from 'ionicons/icons';

@Component({
  selector: 'app-wish-modal',
  templateUrl: './wish-modal.component.html',
  styleUrls: ['./wish-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    IonicModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class WishModalComponent implements OnInit, AfterViewInit {
  @Input() wish: string = '';

  constructor(private modalService: ModalService) {
    addIcons({ closeOutline, heartOutline });
  }

  ngOnInit() {}

  ngAfterViewInit() {
    // Встановлюємо фокус на кнопку закриття після відображення модального вікна
    setTimeout(() => {
      const closeButton = document.querySelector('.close-button') as HTMLElement;
      if (closeButton) {
        closeButton.focus();
      }
    }, 100);
  }

  async dismiss(): Promise<void> {
    await this.modalService.dismissModal();
  }
} 