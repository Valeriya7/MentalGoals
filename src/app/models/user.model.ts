import { User as FirebaseUser } from '@angular/fire/auth';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  emailVerified: boolean;
  idToken: string;
  tokenExpiration: number;
  points: number;
  level: number;
  challenges: string[];
  completedChallenges: string[];
  activeChallenge: string | null;
}

export interface AppUser extends User {
  accessToken?: string;
}

export function convertFirebaseUser(firebaseUser: any): User {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    photoURL: firebaseUser.photoURL || '',
    emailVerified: firebaseUser.emailVerified,
    idToken: firebaseUser.idToken || '',
    tokenExpiration: Date.now() + 3600000,
    points: 0,
    level: 1,
    challenges: [],
    completedChallenges: [],
    activeChallenge: null
  };
} 