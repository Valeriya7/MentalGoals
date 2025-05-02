import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Platform } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  Firestore,
  onSnapshot,
  refEqual,
  getCountFromServer,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  AuthCredential,
  signInWithPopup,
  UserCredential,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User as FirebaseUser
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { User as AppUser, convertFirebaseUser } from '../models/user.model';
import { environment } from '../../environments/environment';
import { FIREBASE_CONFIG, GOOGLE_CLIENT_IDS } from '../constants/firebase.config';
import { GoogleAuthService } from './google-auth.service';
import { appConfig } from '../config/app.config';
import { config } from '../config/config';
import { map, catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private platform = inject(Platform);
  private auth!: Auth;
  private db!: Firestore;
  private googleProvider = new GoogleAuthProvider();
  private googleAuthInitialized = false;
  private isOffline = false;
  private isOnline = new BehaviorSubject<boolean>(true);
  private readonly OFFLINE_DATA_KEY = 'offline_data';
  private firebaseReady = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<AppUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private initStarted = false;

  constructor(
    private router: Router,
    private toastController: ToastController,
    private translate: TranslateService,
    private googleAuthService: GoogleAuthService
  ) {
    addIcons({ logOutOutline });
    this.init();
  }

  private async init() {
    if (this.initStarted) return;
    this.initStarted = true;

    try {
      console.log('Starting Firebase initialization...');

      // Step 1: Initialize Firebase App
      const app = initializeApp(config.firebase);
      
      // Step 2: Initialize Auth
      this.auth = getAuth(app);
      
      // Step 3: Initialize Firestore
      this.db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });

      // Step 4: Enable persistence
      try {
        console.log('Enabling persistence...');
        await enableIndexedDbPersistence(this.db);
        console.log('Persistence enabled successfully');
      } catch (err: any) {
        if (err.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
          console.warn('The current browser does not support persistence.');
        } else {
          console.error('Error enabling persistence:', err);
        }
      }

      // Step 5: Continue with the rest of initialization
      await this.setupAuth();
      await this.initializeGoogleAuth();
      await this.checkNetworkStatus();

      console.log('Firebase initialization complete');
      this.firebaseReady.next(true);
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      this.firebaseReady.next(false);
    }
  }

  private async setupAuth(): Promise<void> {
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userData = await this.getUserData(user.uid);
        this.currentUserSubject.next(userData);
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  private getClientId(): string {
    if (this.platform.is('ios')) {
      return appConfig.googleAuth.clientId.ios;
    } else if (this.platform.is('android')) {
      return appConfig.googleAuth.clientId.android;
    }
    return appConfig.googleAuth.clientId.web;
  }

  public async initializeGoogleAuth() {
    if (this.googleAuthInitialized) {
      return;
    }

    try {
      if (this.platform.is('capacitor')) {
        await GoogleAuth.initialize({
          clientId: this.platform.is('ios') 
            ? config.googleAuth.clientId.ios 
            : config.googleAuth.clientId.android,
          scopes: config.googleAuth.scopes,
          grantOfflineAccess: true
        });
      } else {
        // Для веб-платформи
        this.googleProvider.setCustomParameters({
          client_id: config.googleAuth.clientId.web
        });
      }
      this.googleAuthInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Google Auth:', error);
      throw error;
    }
  }

  private async checkNetworkStatus(): Promise<void> {
    try {
      const status = await Network.getStatus();
      this.isOnline.next(status.connected);
      console.log('Network status:', status);

      // Set up network status change listener
      Network.addListener('networkStatusChange', (status) => {
        this.isOnline.next(status.connected);
        if (status.connected) {
          this.syncOfflineData();
        }
      });
    } catch (error) {
      console.error('Error checking network status:', error);
    }
  }

  public async signInWithGoogle(): Promise<UserCredential> {
    try {
      if (!this.googleAuthInitialized) {
        await this.initializeGoogleAuth();
      }

      const result = await signInWithPopup(this.auth, this.googleProvider);
      
      if (!result.user) {
        throw new Error('Не вдалося отримати дані користувача від Google');
      }

      const userData = convertFirebaseUser(result.user);
      await this.saveUserData(userData);
      return result;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Вікно авторизації було закрито. Будь ласка, спробуйте ще раз.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Спроба входу була скасована. Будь ласка, спробуйте ще раз.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Вікно авторизації було заблоковано браузером. Будь ласка, дозвольте спливаючі вікна для цього сайту.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Помилка мережі. Будь ласка, перевірте підключення до інтернету.');
      }
      
      throw new Error('Помилка входу через Google. Будь ласка, спробуйте ще раз.');
    }
  }

  public async signOut(): Promise<void> {
    try {
      await firebaseSignOut(this.auth);
      await this.router.navigate(['/auth']);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  // Check authentication state
  async checkAuthState(): Promise<AppUser | null> {
    return new Promise((resolve, reject) => {
      onAuthStateChanged(this.auth, async (firebaseUser) => {
        if (firebaseUser) {
          const userData = await this.getUserData(firebaseUser.uid);
          resolve(userData);
        } else {
          resolve(null);
        }
      }, (error: Error) => {
        console.error('Auth state error:', error);
        reject(error);
      });
    });
  }

  // Get current user
  getCurrentUser() {
    return this.auth.currentUser;
  }

  // Save data
  async saveData<T extends { [key: string]: any }>(collectionName: string, id: string, data: T) {
    try {
      if (!this.isOnline.value) {
        await this.saveOfflineData(collectionName, data, id);
        return;
      }

      const collectionRef = collection(this.db, collectionName);
      await setDoc(doc(collectionRef, id), data);
    } catch (error) {
      console.error(`Error saving data to ${collectionName}:`, error);
      await this.saveOfflineData(collectionName, data, id);
      throw error;
    }
  }

  // Get data
  async getData<T extends { [key: string]: any }>(collectionName: string, id?: string): Promise<T | T[] | null> {
    try {
      if (!this.isOnline.value) {
        const offlineData = await this.getOfflineData<T>(collectionName, id);
        if (!offlineData) return null;
        return id ? offlineData[0]?.data || null : offlineData.map(item => item.data);
      }

      const collectionRef = collection(this.db, collectionName);
      if (id) {
        const docRef = doc(collectionRef, id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() as T : null;
      } else {
        const querySnapshot = await getDocs(collectionRef);
        return querySnapshot.docs.map(doc => doc.data() as T);
      }
    } catch (error) {
      console.error(`Error getting data from ${collectionName}:`, error);
      const offlineData = await this.getOfflineData<T>(collectionName, id);
      if (!offlineData) return null;
      return id ? offlineData[0]?.data || null : offlineData.map(item => item.data);
    }
  }

  // Sync offline data
  private async syncOfflineData() {
    try {
      const offlineData = await this.getOfflineData();
      if (!offlineData) return;

      for (const item of offlineData) {
        if (item.id) {
          await this.saveData(item.collection, item.id, item.data);
        }
      }

      await Preferences.remove({ key: this.OFFLINE_DATA_KEY });
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  }

  // Save data offline
  private async saveOfflineData<T extends { [key: string]: any }>(collectionName: string, data: T, id?: string) {
    try {
      const existingData = await this.getOfflineData<T>();
      const newItem: OfflineDataItem<T> = {
        collection: collectionName,
        data,
        id,
        timestamp: new Date().toISOString()
      };

      const updatedData = existingData ? (Array.isArray(existingData) ? existingData : []) : [];
      updatedData.push(newItem);
      await Preferences.set({
        key: this.OFFLINE_DATA_KEY,
        value: JSON.stringify(updatedData)
      });
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }

  // Get offline data
  private async getOfflineData<T extends { [key: string]: any }>(collectionName?: string, id?: string): Promise<OfflineDataItem<T>[] | null> {
    try {
      const { value } = await Preferences.get({ key: this.OFFLINE_DATA_KEY });
      if (!value) return null;

      const data = JSON.parse(value) as OfflineDataItem<T>[];
      if (!collectionName) return data;

      return data.filter((item) => {
        if (item.collection !== collectionName) return false;
        if (id && item.id !== id) return false;
        return true;
      });
    } catch (error) {
      console.error('Error getting offline data:', error);
      return null;
    }
  }

  // Check connection
  isConnected() {
    return this.isOnline.value;
  }

  async updateUserData(userId: string, data: Partial<AppUser>): Promise<void> {
    try {
      const userRef = doc(this.db, 'users', userId);
      await updateDoc(userRef, data);

      // Update local data
      const { value } = await Preferences.get({ key: 'userData' });
      if (value) {
        const userData = JSON.parse(value);
        const updatedData = { ...userData, ...data };
        await Preferences.set({
          key: 'userData',
          value: JSON.stringify(updatedData)
        });
      }
    } catch (error: unknown) {
      console.error('Error updating user data:', error);
      if (error instanceof Error) {
        await this.showErrorToast(error.message);
      }
    }
  }

  public async getUserData(uid: string): Promise<AppUser | null> {
    try {
      const userRef = doc(this.db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as AppUser;
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message: this.translate.instant('ERRORS.' + message),
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  async getGoogleCredential(idToken: string): Promise<AuthCredential> {
    return GoogleAuthProvider.credential(idToken);
  }

  async signInWithCredential(credential: AuthCredential): Promise<UserCredential> {
    return await signInWithCredential(this.auth, credential);
  }

  getAuthInstance(): Auth {
    return this.auth;
  }

  getFirestore(): Firestore {
    return this.db;
  }

  private async saveUserData(userData: AppUser): Promise<void> {
    try {
      const userRef = doc(this.db, 'users', userData.uid);
      await setDoc(userRef, {
        ...userData,
        idToken: userData.idToken || '',
        tokenExpiration: userData.tokenExpiration || Date.now() + 3600000
      }, { merge: true });
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  }

  async createUser(email: string, password: string): Promise<AppUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const firebaseUser = userCredential.user;

      if (!firebaseUser) {
        throw new Error('Помилка створення користувача');
      }

      const userData: AppUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Користувач',
        photoURL: firebaseUser.photoURL || '',
        emailVerified: firebaseUser.emailVerified,
        idToken: await firebaseUser.getIdToken(),
        tokenExpiration: Date.now() + 3600000,
        points: 0,
        level: 1,
        challenges: [],
        completedChallenges: [],
        activeChallenge: null
      };

      await this.updateUserData(firebaseUser.uid, userData);
      await Preferences.set({ key: 'user', value: JSON.stringify(userData) });

      return userData;
    } catch (error: unknown) {
      console.error('Помилка створення користувача:', error);
      throw error;
    }
  }

  async signInWithEmailAndPassword(email: string, password: string): Promise<AppUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const firebaseUser = userCredential.user;

      if (!firebaseUser) {
        throw new Error('Помилка авторизації');
      }

      const userData: AppUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Користувач',
        photoURL: firebaseUser.photoURL || '',
        emailVerified: firebaseUser.emailVerified,
        idToken: await firebaseUser.getIdToken(),
        tokenExpiration: Date.now() + 3600000,
        points: 0,
        level: 1,
        challenges: [],
        completedChallenges: [],
        activeChallenge: null
      };

      await this.updateUserData(firebaseUser.uid, userData);
      await Preferences.set({ key: 'user', value: JSON.stringify(userData) });

      return userData;
    } catch (error: unknown) {
      console.error('Помилка входу:', error);
      throw error;
    }
  }

  private async handleAuthStateChange(user: AppUser | null) {
    if (user) {
      const userData: AppUser = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        emailVerified: user.emailVerified,
        idToken: user.idToken || '',
        tokenExpiration: user.tokenExpiration || Date.now() + 3600000,
        points: user.points || 0,
        level: user.level || 1,
        challenges: user.challenges || [],
        completedChallenges: user.completedChallenges || [],
        activeChallenge: user.activeChallenge || null
      };
      this.currentUserSubject.next(userData);
    } else {
      this.currentUserSubject.next(null);
    }
  }
}

interface OfflineDataItem<T> {
  collection: string;
  data: T;
  id?: string;
  timestamp: string;
}

