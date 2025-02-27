import { Injectable } from '@angular/core';
//import { Plugins } from '@capacitor/core';
//import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor() {
   // GoogleAuth.initialize();
  }

  async login() {
 // const user = await GoogleAuth.signIn();
   // return user;
  }
}
