import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  constructor(private platform: Platform) {}

  async initialize(): Promise<void> {
    if (this.platform.is('capacitor')) {
      try {
        await GoogleAuth.initialize({
          clientId: environment.googleAuth.webClientId,
          scopes: ['profile', 'email'],
          serverClientId: environment.googleAuth.webClientId
        });
      } catch (error) {
        console.error('Error initializing Google Auth:', error);
      }
    }
  }

  async signIn(): Promise<User> {
    if (this.platform.is('capacitor')) {
      try {
        const user = await GoogleAuth.signIn();
        const idToken = await GoogleAuth.getTokens();
        
        return {
          uid: user.id,
          email: user.email || '',
          displayName: user.name || '',
          photoURL: user.imageUrl || '',
          emailVerified: true,
          idToken: idToken.accessToken,
          tokenExpiration: Date.now() + 3600000,
          points: 0,
          level: 1,
          challenges: [],
          completedChallenges: [],
          activeChallenge: null
        };
      } catch (error) {
        console.error('Error signing in with Google:', error);
        throw error;
      }
    }
    throw new Error('Platform not supported');
  }

  async signOut(): Promise<void> {
    if (this.platform.is('capacitor')) {
      try {
        await GoogleAuth.signOut();
      } catch (error) {
        console.error('Error signing out:', error);
        throw error;
      }
    }
  }
} 