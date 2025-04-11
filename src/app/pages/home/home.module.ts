import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';
import { HomePageRoutingModule } from './home-routing.module';
import { EmotionalStateModalComponent } from '../../components/emotional-state-modal/emotional-state-modal.component';
import { EmotionalCalendarComponent } from '../../components/emotional-calendar/emotional-calendar.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    EmotionalStateModalComponent,
    EmotionalCalendarComponent
  ],
  declarations: [HomePage]
})
export class HomePageModule {} 