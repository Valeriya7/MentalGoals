import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { EmotionalCalendarComponent } from './emotional-calendar.component';
import { EmotionalStateModalModule } from '../emotional-state-modal/emotional-state-modal.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EmotionalStateModalModule
  ],
  declarations: [EmotionalCalendarComponent],
  exports: [EmotionalCalendarComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class EmotionalCalendarModule {} 