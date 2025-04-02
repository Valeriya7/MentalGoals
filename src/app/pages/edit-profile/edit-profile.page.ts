import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { saveOutline } from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.page.html',
  styleUrls: ['./edit-profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslateModule]
})
export class EditProfilePage implements OnInit {
  userData = {
    name: '',
    email: '',
    phone: '',
    bio: ''
  };

  constructor(private router: Router) {
    addIcons({
      'save-outline': saveOutline
    });
  }

  async ngOnInit() {
    await this.loadUserData();
  }

  private async loadUserData() {
    try {
      const { value: name } = await Preferences.get({ key: 'name' });
      const { value: email } = await Preferences.get({ key: 'email' });
      const { value: phone } = await Preferences.get({ key: 'phone' });
      const { value: bio } = await Preferences.get({ key: 'bio' });
      
      if (name) this.userData.name = name;
      if (email) this.userData.email = email;
      if (phone) this.userData.phone = phone;
      if (bio) this.userData.bio = bio;
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  async saveProfile() {
    try {
      await Preferences.set({ key: 'name', value: this.userData.name });
      await Preferences.set({ key: 'email', value: this.userData.email });
      await Preferences.set({ key: 'phone', value: this.userData.phone });
      await Preferences.set({ key: 'bio', value: this.userData.bio });

      this.router.navigate(['/tabs/profile']);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  }
} 