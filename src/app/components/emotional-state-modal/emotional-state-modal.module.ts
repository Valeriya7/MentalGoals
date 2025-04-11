import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EmotionalStateModalComponent } from './emotional-state-modal.component';
import { EmotionalService } from '../../services/emotional.service';

@NgModule({
  declarations: [EmotionalStateModalComponent],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [EmotionalService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class EmotionalStateModalModule { } 