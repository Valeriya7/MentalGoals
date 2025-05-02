import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Capacitor } from '@capacitor/core';
import { FirebaseService } from '../../services/firebase.service';
import { User } from '../../models/user.model';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logoGoogle } from 'ionicons/icons';

addIcons({ logoGoogle });

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  user: User | null = null;
  loading = false;
  error = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.initGoogleAuth();
  }

  private async initGoogleAuth() {
    try {
      await this.firebaseService.initializeGoogleAuth();
    } catch (error: any) {
      await this.presentToast(error.message || 'Помилка ініціалізації Google автентифікації');
    }
  }

  async signInWithGoogle() {
    this.loading = true;
    this.error = '';
    
    try {
      const user = await this.firebaseService.signInWithGoogle();
      if (user) {
        await this.router.navigate(['/tabs/home']);
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      this.error = error.message || 'Помилка входу через Google';
      
      // Показуємо повідомлення про помилку тільки якщо це не користувацька помилка
      if (!error.message?.includes('закрито') && !error.message?.includes('скасована')) {
        await this.presentToast(this.error);
      }
    } finally {
      this.loading = false;
    }
  }

  private async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }
}
