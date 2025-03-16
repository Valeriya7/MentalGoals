import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _storage: Storage | null = null;
  private _initialized = new BehaviorSubject<boolean>(false);

  constructor() {
    this._storage = new Storage();
  }

  async init(): Promise<void> {
    try {
      if (this._initialized.value) {
        return;
      }

      await this._storage?.create();
      this._initialized.next(true);
      console.log('Storage initialized successfully');
    } catch (error) {
      console.error('Error initializing storage:', error);
      this._storage = null;
      this._initialized.next(false);
      throw error;
    }
  }

  public get isInitialized() {
    return this._initialized.asObservable();
  }

  private async ensureInitialized(): Promise<void> {
    if (!this._initialized.value) {
      await this.init();
    }
    
    if (!this._storage) {
      throw new Error('Storage not initialized');
    }
  }

  async get(key: string): Promise<any> {
    await this.ensureInitialized();
    return this._storage!.get(key);
  }

  async set(key: string, value: any): Promise<any> {
    await this.ensureInitialized();
    return this._storage!.set(key, value);
  }

  async remove(key: string): Promise<any> {
    await this.ensureInitialized();
    return this._storage!.remove(key);
  }

  async clear(): Promise<void> {
    await this.ensureInitialized();
    return this._storage!.clear();
  }

  async keys(): Promise<string[]> {
    await this.ensureInitialized();
    return this._storage!.keys();
  }

  async length(): Promise<number> {
    await this.ensureInitialized();
    return this._storage!.length();
  }
} 