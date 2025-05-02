import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { User } from '../models/user.model';
import { GoogleAuthService } from './google-auth.service';
import { map } from 'rxjs/operators';
import { FirebaseService } from './firebase.service';
import { UserCredential } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private router: Router,
    private platform: Platform,
    private googleAuthService: GoogleAuthService,
    private firebaseService: FirebaseService
  ) {
    this.firebaseService.currentUser$.subscribe(user => {
      this.currentUserSubject.next(user);
    });
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  async updateUserPoints(points: number): Promise<void> {
    const user = this.getCurrentUser();
    if (user) {
      const updatedUser = {
        ...user,
        points: (user.points || 0) + points
      };
      this.currentUserSubject.next(updatedUser);
    }
  }

  async signInWithGoogle(): Promise<User> {
    try {
      const userCredential = await this.firebaseService.signInWithGoogle();
      if (!userCredential.user) {
        throw new Error('No user data received from Google');
      }

      const user: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName: userCredential.user.displayName || '',
        photoURL: userCredential.user.photoURL || '',
        emailVerified: userCredential.user.emailVerified,
        idToken: await userCredential.user.getIdToken(),
        tokenExpiration: Date.now() + 3600000, // 1 hour from now
        points: 0,
        level: 1,
        challenges: [],
        completedChallenges: [],
        activeChallenge: null
      };

      await this.firebaseService.saveData('users', user.uid, user);
      return user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    await this.firebaseService.signOut();
  }

  isAuthenticated(): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => !!user && user.tokenExpiration > Date.now())
    );
  }
}
