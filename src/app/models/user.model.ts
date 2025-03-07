export interface User {
  displayName?: string;
  email?: string;
  photoURL?: string;
  idToken?: string;
  name?: string;
  imageUrl?: string;
  authentication?: {
    idToken: string;
    accessToken: string;
  };
} 