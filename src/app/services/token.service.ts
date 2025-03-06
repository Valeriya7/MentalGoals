import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private _idToken: string | null = null;

  get idToken(): string | null {
    return this._idToken;
  }

  set idToken(value: string | null) {
    this._idToken = value;
  }

  async clearToken(): Promise<void> {
    this._idToken = null;
    await Preferences.remove({ key: 'idToken' });
  }

  async loadToken(): Promise<void> {
    const { value } = await Preferences.get({ key: 'idToken' });
    this._idToken = value;
  }
} 