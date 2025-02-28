import { Component, OnInit } from '@angular/core';
import { UtilService } from 'src/app/services/util.service';
import { Preferences } from '@capacitor/preferences';
import { NavigationExtras } from '@angular/router';
//import { register } from 'swiper/element';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  userName: any = '';

  constructor(
    public util: UtilService
  ) {
  }

  ngOnInit() {
    this.getUserData();
  }

  onPage(name: string) {
    this.util.navigateToPage(name);
  }

  async getUserData() {
    const name = await Preferences.get({key: 'name'});
    console.log('name:', name);
    if (name)
      this.userName = name.value;

    console.log('userName:', this.userName);
    return name;
  }
}
