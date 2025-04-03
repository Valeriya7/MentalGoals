import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { DailyWishComponent } from './daily-wish.component';

@NgModule({
  declarations: [DailyWishComponent],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [DailyWishComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DailyWishModule { } 