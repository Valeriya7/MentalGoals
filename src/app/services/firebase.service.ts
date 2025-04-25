import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, updateDoc, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithCredential, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { environment } from '../../environments/environment';
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { BehaviorSubject } from 'rxjs';
import { User } from '../interfaces/user.interface';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { take } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private db: any;
  public auth: any;
  private isOnline = new BehaviorSubject<boolean>(true);
  private readonly OFFLINE_DATA_KEY = 'offline_data';
  private googleAuthInitialized = false;
  private firebaseReady = new BehaviorSubject<boolean>(false);

  constructor(
    private router: Router,
    private toastController: ToastController,
    private translate: TranslateService
  ) {
    try {
      // Ініціалізуємо Firebase
      const app = initializeApp(environment.firebase);
      this.auth = getAuth(app);  // Initialize auth first

      // Очищення кешу IndexedDB
      if (typeof window !== 'undefined' && window.indexedDB) {
        const request = window.indexedDB.deleteDatabase('firebaseLocalStorageDb');
        request.onsuccess = () => {
          console.log('IndexedDB cache cleared successfully');
        };
        request.onerror = (error) => {
          console.error('Error clearing IndexedDB cache:', error);
        };
      }

      // Ініціалізуємо Firestore з налаштуваннями для офлайн-режиму
      this.db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });

      // Вмикаємо офлайн-персистентність
      enableIndexedDbPersistence(this.db)
        .then(() => {
          console.log('Firestore offline persistence enabled');
        })
        .catch((error) => {
          console.warn('Firestore offline persistence could not be enabled:', error);
        });

      this.auth = getAuth(app);

      // Обробляємо перенаправлення після входу
      if (!Capacitor.isNativePlatform()) {
        getRedirectResult(this.auth).then((result) => {
          if (result) {
            const user = result.user;
            if (user) {
              const userData: User = {
                id: user.uid,
                email: user.email || '',
                displayName: user.displayName || '',
                photoURL: user.photoURL || '',
                points: 0,
                level: 1,
                challenges: [],
                completedChallenges: [],
                activeChallenge: null,
                lastLogin: new Date().toISOString()
              };

              // Зберігаємо дані користувача в Firestore
              const userRef = doc(this.db, 'users', user.uid);
              setDoc(userRef, userData, { merge: true });

              // Зберігаємо дані локально
              Preferences.set({
                key: 'userData',
                value: JSON.stringify(userData)
              });
            }
          }
        }).catch((error) => {
          console.error('Error handling redirect:', error);
        });
      }

      // Слідкуємо за зміною стану автентифікації
      onAuthStateChanged(this.auth, (user) => {
        if (user) {
          console.log('User is signed in:', user);
        } else {
          console.log('No user is signed in');
        }
      });

      // Слідкуємо за зміною стану мережі
      Network.addListener('networkStatusChange', status => {
        console.log('Network status changed:', status.connected);
        this.isOnline.next(status.connected);
        if (status.connected) {
          this.syncOfflineData().catch(error => {
            console.error('Error syncing offline data:', error);
          });
        }
      });

      // Перевіряємо початковий стан мережі
      Network.getStatus().then(status => {
        console.log('Initial network status:', status.connected);
        this.isOnline.next(status.connected);
      });

      this.init();
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
  }

  private async init() {
    try {
      // Ініціалізуємо Google Auth для Capacitor
      if (Capacitor.isNativePlatform()) {
        try {
          // Get the correct client ID from your environment.ts or from Firebase console
          //const clientId = environment.googleClientId; // Make sure this is set in your environment files

          await GoogleAuth.initialize({
            clientId: '316790340348-8ebvi6dun25a1h8l22pdeinl32tqkaj0.apps.googleusercontent.com', //'629190984804-no655ouoceoo29td33q34f32ek2eanne.apps.googleusercontent.com',
            scopes: ['profile', 'email'],
            grantOfflineAccess: true
          });
          this.googleAuthInitialized = true;
          console.log('Google Auth initialized successfully');
          // Signal that Firebase is ready at the end
          this.firebaseReady.next(true);
        } catch (error) {
          console.error('Error initializing Google Auth:', error);
          this.googleAuthInitialized = false;
        }
      }else {
        // For web platform, just signal that Firebase is ready
        this.firebaseReady.next(true);
      }

      // Перевіряємо, чи є збережені дані користувача
      const { value } = await Preferences.get({ key: 'userData' });
      if (value) {
        const userData = JSON.parse(value);
        console.log('Loaded user data from storage:', userData);
      }
    } catch (error: unknown) {
      console.error('Error initializing Firebase service:', error);
      if (error instanceof Error) {
        await this.showErrorToast(error.message);
      }
    }
  }

  async signInWithGoogle(idToken: string): Promise<any> {
    try {
      // Wait for Firebase to be ready
      if (!this.firebaseReady.value) {
        await firstValueFrom(this.firebaseReady.pipe(
          take(1) // Use take instead of filter
        ));
      }
      if (!this.auth) {
        console.error('Auth not initialized, attempting to reinitialize');
        this.auth = getAuth();  // Try to get auth again

        if (!this.auth) {
          throw new Error('Firebase Auth not initialized');
        }
      }

      // Створюємо credential з idToken
      const credential = GoogleAuthProvider.credential(idToken);

      // Використовуємо credential для входу
      const result = await signInWithCredential(this.auth, credential);

      if (!result.user) {
        throw new Error('Failed to sign in with Google');
      }

      // Отримуємо додаткові дані користувача
      const userData = {
        id: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || '',
        photoURL: result.user.photoURL || '',
        idToken: idToken,
        tokenExpiration: Date.now() + 3600 * 1000 // Токен дійсний 1 годину
      };
      console.log('userData: ',userData);

      // Зберігаємо дані користувача
      await Preferences.set({
        key: 'userData',
        value: JSON.stringify(userData)
      });

      return result;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  // Вихід користувача
  async logout() {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  // Перевірка стану автентифікації
  async checkAuthState(): Promise<User | null> {
    return new Promise((resolve, reject) => {
      onAuthStateChanged(this.auth, async (user) => {
        if (user) {
          const userData = await this.getUserData(user.uid);
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

  // Отримання поточного користувача
  getCurrentUser() {
    return this.auth.currentUser;
  }

  // Збереження даних
  async saveData(collectionName: string, data: any, id?: string) {
    try {
      if (!this.isOnline.value) {
        await this.saveOfflineData(collectionName, data, id);
        return;
      }

      const collectionRef = collection(this.db, collectionName);
      if (id) {
        await setDoc(doc(collectionRef, id), data);
      } else {
        await setDoc(doc(collectionRef), data);
      }
    } catch (error) {
      console.error(`Error saving data to ${collectionName}:`, error);
      await this.saveOfflineData(collectionName, data, id);
      throw error;
    }
  }

  // Отримання даних
  async getData(collectionName: string, id?: string) {
    try {
      if (!this.isOnline.value) {
        return this.getOfflineData(collectionName, id);
      }

      const collectionRef = collection(this.db, collectionName);
      if (id) {
        const docRef = doc(collectionRef, id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
      } else {
        const querySnapshot = await getDocs(collectionRef);
        return querySnapshot.docs.map(doc => doc.data());
      }
    } catch (error) {
      console.error(`Error getting data from ${collectionName}:`, error);
      return this.getOfflineData(collectionName, id);
    }
  }

  // Синхронізація офлайн-даних
  private async syncOfflineData() {
    try {
      const offlineData = await this.getOfflineData();
      if (!offlineData || offlineData.length === 0) return;

      for (const item of offlineData) {
        await this.saveData(item.collection, item.data, item.id);
      }

      await Preferences.remove({ key: this.OFFLINE_DATA_KEY });
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  }

  // Збереження даних офлайн
  private async saveOfflineData(collectionName: string, data: any, id?: string) {
    try {
      const existingData = await this.getOfflineData();
      const newItem = {
        collection: collectionName,
        data,
        id,
        timestamp: new Date().toISOString()
      };

      const updatedData = existingData ? [...existingData, newItem] : [newItem];
      await Preferences.set({
        key: this.OFFLINE_DATA_KEY,
        value: JSON.stringify(updatedData)
      });
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }

  // Отримання офлайн-даних
  private async getOfflineData(collectionName?: string, id?: string) {
    try {
      const { value } = await Preferences.get({ key: this.OFFLINE_DATA_KEY });
      if (!value) return null;

      const data = JSON.parse(value);
      if (!collectionName) return data;

      return data.filter((item: OfflineDataItem) => {
        if (item.collection !== collectionName) return false;
        if (id && item.id !== id) return false;
        return true;
      });
    } catch (error) {
      console.error('Error getting offline data:', error);
      return null;
    }
  }

  // Перевірка підключення
  isConnected() {
    return this.isOnline.value;
  }

  async updateUserData(userId: string, data: Partial<User>): Promise<void> {
    try {
      const userRef = doc(this.db, 'users', userId);
      await updateDoc(userRef, data);

      // Оновлюємо локальні дані
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

  async getUserData(userId: string): Promise<User | null> {
    try {
      const userRef = doc(this.db, 'users', userId);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        return docSnap.data() as User;
      }
      return null;
    } catch (error: unknown) {
      console.error('Error getting user data:', error);
      if (error instanceof Error) {
        await this.showErrorToast(error.message);
      }
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

  private async initializeFirestore() {
    try {
      const firestore = initializeFirestore(this.db, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
      console.log('Firestore initialized with offline persistence');
    } catch (err: unknown) {
      console.error('Error enabling offline persistence:', err);
    }
  }

  async getGoogleCredential(idToken: string) {
    const credential = GoogleAuthProvider.credential(idToken);
    return credential;
  }

  async signInWithCredential(credential: any) {
    const auth = getAuth();
    return await signInWithCredential(auth, credential);
  }

  getAuthInstance() {
    if (!this.auth) {
      throw new Error('Firebase Auth not initialized');
    }
    return this.auth;
  }
}

interface OfflineDataItem {
  collection: string;
  data: any;
  id?: string;
  timestamp: string;
}
