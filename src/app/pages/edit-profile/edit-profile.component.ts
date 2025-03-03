import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { saveOutline } from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule]
})
export class EditProfileComponent implements OnInit {
  userProfile = {
    name: '',
    email: '',
    bio: ''
  };

  constructor() {
    addIcons({ saveOutline });
  }

  async ngOnInit() {
    await this.loadUserProfile();
  }

  async loadUserProfile() {
    try {
      const { value: name } = await Preferences.get({ key: 'name' });
      const { value: email } = await Preferences.get({ key: 'email' });
      const { value: bio } = await Preferences.get({ key: 'bio' });

      this.userProfile = {
        name: name || '',
        email: email || '',
        bio: bio || ''
      };
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  async saveProfile() {
    try {
      await Preferences.set({ key: 'name', value: this.userProfile.name });
      await Preferences.set({ key: 'bio', value: this.userProfile.bio });
      // Email не змінюємо, оскільки він є ідентифікатором
      console.log('Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  }
}
