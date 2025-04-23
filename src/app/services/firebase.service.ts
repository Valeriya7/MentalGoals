import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { environment } from '../../environments/environment';
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private db: any;
  public auth: any;
  private isOnline = new BehaviorSubject<boolean>(true);
  private readonly OFFLINE_DATA_KEY = 'offline_data';

  constructor() {
    try {
      // Ініціалізуємо Firebase
      const app = initializeApp(environment.firebase);
      this.db = getFirestore(app);
      this.auth = getAuth(app);

      // Слідкуємо за зміною стану автентифікації
      onAuthStateChanged(this.auth, (user) => {
        if (user) {
          console.log('User is signed in:', user);
        } else {
          console.log('No user is signed in');
        }
      });

      // Включаємо офлайн-персистентність
      enableIndexedDbPersistence(this.db)
        .then(() => {
          console.log('Firebase persistence enabled');
        })
        .catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
          } else if (err.code === 'unimplemented') {
            console.warn('The current browser does not support persistence.');
          } else {
            console.error('Error enabling persistence:', err);
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
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
  }

  // Реєстрація користувача
  async register(email: string, password: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  // Вхід користувача
  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error logging in:', error);
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

  // Отримання поточного користувача
  getCurrentUser() {
    return this.auth.currentUser;
  }

  // Збереження даних
  async saveData(collectionName: string, data: any, id?: string) {
    try {
      if (!this.isOnline.value) {
        // Зберігаємо дані офлайн
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
      // При помилці зберігаємо дані офлайн
      await this.saveOfflineData(collectionName, data, id);
      throw error;
    }
  }

  // Отримання даних
  async getData(collectionName: string, id?: string) {
    try {
      if (!this.isOnline.value) {
        // Отримуємо дані з офлайн-сховища
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
      // При помилці отримуємо дані з офлайн-сховища
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

      // Очищаємо офлайн-сховище після успішної синхронізації
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
}

interface OfflineDataItem {
  collection: string;
  data: any;
  id?: string;
  timestamp: string;
} 