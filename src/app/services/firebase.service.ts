import { Injectable, signal } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { initializeApp, FirebaseApp, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithPopup,
  Auth,
  UserCredential
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  DocumentData,
  QueryDocumentSnapshot,
  CollectionReference
} from 'firebase/firestore';
import { getFirebaseConfig, getGoogleConfig } from '../config/firebase.config';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private static instance: FirebaseService;
  private app!: FirebaseApp;
  private auth!: Auth;
  private firestore!: Firestore;
  private _db!: Firestore;
  private googleAuthProvider!: GoogleAuthProvider;
  private googleAuthInitialized = false;
  public firebaseReady = new BehaviorSubject<boolean>(false);
  private isOnline = new BehaviorSubject<boolean>(true);
  private readonly OFFLINE_DATA_KEY = 'offline_data';
  private isInitialized = false;

  constructor(
    private platform: Platform,
    private router: Router,
    private toastController: ToastController,
    private translate: TranslateService
  ) {
    if (FirebaseService.instance) {
      return FirebaseService.instance;
    }
    FirebaseService.instance = this;
    this.googleAuthProvider = new GoogleAuthProvider();
    this.initializeFirebase();
  }

  async initializeFirebase(): Promise<void> {
    if (this.isInitialized) {
      console.log('Firebase already initialized');
      return;
    }

    try {
      console.log('Initializing Firebase...');
      const config = getFirebaseConfig();
      this.app = initializeApp(config);
      console.log('Firebase app initialized');

      // Initialize Auth
      this.auth = getAuth(this.app);
      console.log('Firebase Auth initialized');

      // Initialize Firestore with offline capabilities and better error handling
      this.firestore = initializeFirestore(this.app, {
        localCache: persistentLocalCache({
          cacheSizeBytes: 50 * 1024 * 1024, // 50MB
          tabManager: persistentMultipleTabManager()
        }),
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true
      });
      console.log('Firestore initialized with offline capabilities');

      // Set the db instance
      this._db = this.firestore;

      // Monitor auth state changes
      onAuthStateChanged(this.auth, (user) => {
        if (user) {
          console.log('User is signed in:', user.uid);
          this.firebaseReady.next(true);
        } else {
          console.log('No user is signed in');
          this.firebaseReady.next(false);
        }
      });

      // Monitor network changes with better error handling
      Network.addListener('networkStatusChange', async status => {
        console.log('Network status changed:', status.connected);
        this.isOnline.next(status.connected);
        if (status.connected) {
          try {
            await this.syncOfflineData();
            console.log('Offline data synced successfully');
          } catch (error) {
            console.error('Error syncing offline data:', error);
          }
        }
      });

      // Check initial network status
      const networkStatus = await Network.getStatus();
      console.log('Initial network status:', networkStatus.connected);
      this.isOnline.next(networkStatus.connected);

      // Initialize Google Auth for native platforms
      if (Capacitor.isNativePlatform()) {
        try {
          const googleConfig = getGoogleConfig();
          console.log('Initializing Google Auth with config:', googleConfig);
          
          // Ініціалізуємо Google Auth
          await GoogleAuth.initialize({
            clientId: googleConfig.clientId,
            scopes: ['profile', 'email'],
            grantOfflineAccess: true,
            forceCodeForRefreshToken: true
          });
          this.googleAuthInitialized = true;
          console.log('Google Auth initialized successfully for native platform');
        } catch (error) {
          console.error('Error initializing Google Auth:', error);
          throw error;
        }
      }

      this.isInitialized = true;
      console.log('Firebase initialization complete');
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      throw error;
    }
  }

  public async ensureFirebaseInitialized() {
    if (!this.app) {
      console.log('Firebase app not initialized, initializing now...');
      await this.initializeFirebase();
    }

    if (!this.firebaseReady.value) {
      console.log('Waiting for Firebase to be ready...');
      await firstValueFrom(this.firebaseReady.pipe(take(1)));
      console.log('Firebase is ready');
    }
  }

  public get db(): Firestore {
    return this._db;
  }

  public get currentUser(): FirebaseUser | null {
    return this.auth?.currentUser || null;
  }

  public get isAuthenticated(): boolean {
    return !!this.auth?.currentUser;
  }

  public async signInWithGoogle(): Promise<FirebaseUser> {
    try {
      await this.ensureFirebaseInitialized();

      if (Capacitor.isNativePlatform()) {
        if (!this.googleAuthInitialized) {
          console.error('Google Auth not initialized');
          throw new Error('Google Auth not initialized');
        }

        console.log('Starting native Google sign in...');
        try {
          const googleUser = await GoogleAuth.signIn();
          console.log('Google Auth response:', googleUser);

          if (!googleUser?.authentication?.idToken) {
            console.error('No ID token in Google Auth response:', googleUser);
            throw new Error('No ID token in Google Auth response');
          }

          const credential = GoogleAuthProvider.credential(
            googleUser.authentication.idToken,
            googleUser.authentication.accessToken
          );

          console.log('Created credential, signing in with Firebase...');
          const userCredential = await signInWithCredential(this.auth, credential);
          console.log('Firebase sign in successful:', userCredential.user.uid);

          return userCredential.user;
        } catch (error: any) {
          console.error('Error during Google sign in:', error);
          if (error.code === '10') {
            throw new Error('Google Sign-In failed. Please try again.');
          }
          throw error;
        }
      } else {
        console.log('Starting web Google sign in...');
        try {
          const result = await signInWithPopup(this.auth, this.googleAuthProvider);
          console.log('Web Google sign in successful:', result.user.uid);
          return result.user;
        } catch (error: any) {
          console.error('Error during web Google sign in:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error in signInWithGoogle:', error);
      throw error;
    }
  }

  public async signOut() {
    try {
      if (this.auth) {
        await this.auth.signOut();
        if (Capacitor.isNativePlatform()) {
          await GoogleAuth.signOut();
        }
      }
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Перевірка стану автентифікації
  async checkAuthState(): Promise<FirebaseUser | null> {
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

  // Збереження даних
  async saveData(collectionName: string, data: any, id?: string) {
    try {
      if (!this.isOnline.value) {
        await this.saveOfflineData(collectionName, data, id);
        return;
      }

      const collectionRef = collection(this.firestore, collectionName);
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

      const collectionRef = collection(this.firestore, collectionName);
      if (id) {
        const docRef = doc(collectionRef, id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
      } else {
        const querySnapshot = await getDocs(collectionRef);
        return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => doc.data());
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

  async updateUserData(userId: string, data: Partial<FirebaseUser>): Promise<void> {
    try {
      const userRef = doc(this.firestore, 'users', userId);
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

  async getUserData(userId: string): Promise<FirebaseUser | null> {
    try {
      const userRef = doc(this.firestore, 'users', userId);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        return docSnap.data() as FirebaseUser;
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

  // Add retry logic for Firestore operations
  private async retryOperation<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: any;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        console.warn(`Operation failed (attempt ${attempt}/${maxRetries}):`, error);

        if (error.code === 'failed-precondition' ||
            error.code === 'unavailable' ||
            error.code === 'resource-exhausted') {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }
    throw lastError;
  }

  // Update the setDoc method to use retry logic
  async setDocument(collection: string, docId: string, data: any): Promise<void> {
    try {
      console.log('Starting setDocument operation...');
      await this.ensureFirebaseInitialized();
      console.log('Firebase initialized successfully');

      // Перевіряємо, чи користувач авторизований
      if (!this.auth.currentUser) {
        console.warn('No authenticated user, saving locally only');
        await this.saveOfflineData(collection, data, docId);
        return;
      }

      console.log('User authenticated:', this.auth.currentUser.uid);

      const docRef = doc(this.firestore, collection, docId);
      console.log(`Document reference created for ${collection}/${docId}`);

      return await this.retryOperation(async () => {
        try {
          const networkStatus = await Network.getStatus();
          console.log('Current network status:', networkStatus.connected);
          
          if (!networkStatus.connected) {
            console.log('Device is offline, saving data locally');
            await this.saveOfflineData(collection, data, docId);
            return;
          }

          // Додаємо метадані до документа
          const documentData = {
            ...data,
            userId: this.auth.currentUser?.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          console.log('Attempting to write document to Firestore...');
          console.log('Document data:', documentData);
          
          await setDoc(docRef, documentData, { merge: true });
          console.log(`Document ${docId} successfully written to ${collection}`);
        } catch (error: any) {
          console.error(`Error writing document ${docId} to ${collection}:`, error);
          console.error('Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack
          });
          
          // Зберігаємо локально при помилці
          await this.saveOfflineData(collection, data, docId);
          throw error;
        }
      });
    } catch (error: any) {
      console.error('Error in setDocument:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      // Зберігаємо дані локально у випадку помилки
      await this.saveOfflineData(collection, data, docId);
      throw error;
    }
  }

  getAuth(): Auth {
    if (!this.auth) {
      throw new Error('Firebase Auth not initialized');
    }
    return this.auth;
  }

  getFirestore(): Firestore {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }
    return this.firestore;
  }

  async getDocument(collection: string, docId: string): Promise<DocumentData | null> {
    try {
      const docRef = doc(this.getFirestore(), collection, docId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error(`Error getting document ${collection}/${docId}:`, error);
      throw error;
    }
  }

  async updateDocument(collection: string, docId: string, data: Partial<DocumentData>): Promise<void> {
    try {
      const docRef = doc(this.getFirestore(), collection, docId);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error(`Error updating document ${collection}/${docId}:`, error);
      throw error;
    }
  }

  async getDocuments(collectionName: string): Promise<DocumentData[]> {
    try {
      const collectionRef = collection(this.getFirestore(), collectionName);
      const querySnapshot = await getDocs(collectionRef);
      return querySnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error);
      throw error;
    }
  }
}

interface OfflineDataItem {
  collection: string;
  data: any;
  id?: string;
  timestamp: string;
}
