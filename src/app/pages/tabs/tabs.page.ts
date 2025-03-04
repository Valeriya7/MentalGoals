import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  home, 
  leaf, 
  calendar, 
  notifications, 
  person 
} from 'ionicons/icons';
//import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule]
  // schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TabsPage {

  constructor() {
    addIcons({
      home,
      leaf,
      calendar,
      notifications,
      person
    });
  }

}
