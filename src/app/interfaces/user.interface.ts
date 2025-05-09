export interface User {
  id: string;
  email: string;
  name: string;
  photoURL: string;
  idToken: string;
  tokenExpiration: string;
  points?: number;
} 