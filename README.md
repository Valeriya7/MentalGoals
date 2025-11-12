# MentalGoals 🧠

An Ionic Angular app for mental health support with a habit tracker, emotional calendar, and self-improvement challenges.

## 📋 Description

MentalGoals is a mobile application designed to support users' mental health through:
- 📊 Habit Tracker
- 📅 Emotional Calendar
- 🎯 Self-improvement Challenges
- 🔔 Reminders and Motivational Notifications
- 👤 User Profile with Personalization

## 🚀 Technologies

- **Ionic Framework** - hybrid mobile framework
- **Angular** - frontend framework
- **Firebase** - backend-as-a-service (authentication, database, storage)
- **Capacitor** - native runtime for iOS and Android

## ⚙️ Installation

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Ionic CLI: `npm install -g @ionic/cli`

### Installation Steps

1. Clone the repository:
```bash
git clone https://github.com/Valeriya7/MentalGoals.git
cd MentalGoals
```

2. Install dependencies:
```bash
npm install
```

3. **IMPORTANT:** Configure the configuration files (see section below)

4. Run the application:
```bash
ionic serve
```

## 🔐 Required Configuration Files

The following files are required for the app to work and are **not included in the repository for security reasons**:

### 1. Firebase Configuration Files

#### `GoogleService-Info.plist` (for iOS)
**Location:** `/GoogleService-Info.plist` (project root)

**Where to get it:**
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project or create a new one
3. Go to **Project Settings** (⚙️ → Project settings)
4. In the **Your apps** section, select the iOS app or create a new one
5. Click the **Download GoogleService-Info.plist** button
6. Place the file in the project root directory

#### `google-services.json` (for Android)
**Location:** `/google-services.json` (project root)

**Where to get it:**
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (⚙️ → Project settings)
4. In the **Your apps** section, select the Android app or create a new one
5. Click the **Download google-services.json** button
6. Place the file in the project root directory

### 2. Environment Configuration

#### Folder `src/environments/`

**Create two files:**

**`src/environments/environment.ts`** (for development):
```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
  }
};
```

**`src/environments/environment.prod.ts`** (for production):
```typescript
export const environment = {
  production: true,
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
  }
};
```

**Where to get environment data:**
1. [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → General
3. Scroll down to the "Your apps" section
4. Select Web app or create a new one
5. In the "SDK setup and configuration" section, select "Config"
6. Copy the `firebaseConfig` values

### 3. Additional Configuration Files

#### File `src/app/config/environment.ts`
**Location:** `src/app/config/environment.ts`

Simple environment configuration file with Firebase and Google Auth settings.

**Create the file:**

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
  },
  googleAuth: {
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com'
  }
};
```

#### File `src/app/config/config.ts`
**Location:** `src/app/config/config.ts`

General application configuration including API settings.

**Create the file:**

```typescript
export const config = {
  api: {
    url: 'https://api.mentalgoals.com',
    defaultLanguage: 'en'
  },
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
  },
  googleAuth: {
    clientId: {
      ios: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
      android: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
      web: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com'
    },
    scopes: ['profile', 'email']
  },
  version: '0.0.1'
};
```

### 4. Firebase Platform Configuration

#### File `src/app/config/firebase.config.ts`
**Location:** `src/app/config/firebase.config.ts`

This file contains Firebase configuration for all platforms (Web, iOS, Android) and Google OAuth client IDs.

**Create the file with this structure:**

```typescript
import { Capacitor } from '@capacitor/core';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  google_app_id?: string;
}

export interface GoogleConfig {
  clientId: string;
}

const WEB_CONFIG: FirebaseConfig = {
  apiKey: "YOUR_WEB_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_WEB_APP_ID"
};

const IOS_CONFIG: FirebaseConfig = {
  apiKey: "YOUR_IOS_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_IOS_APP_ID"
};

const ANDROID_CONFIG: FirebaseConfig = {
  apiKey: "YOUR_ANDROID_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_ANDROID_APP_ID",
  google_app_id: "YOUR_ANDROID_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

const WEB_GOOGLE_CONFIG: GoogleConfig = {
  clientId: "YOUR_WEB_OAUTH_CLIENT_ID.apps.googleusercontent.com"
};

const IOS_GOOGLE_CONFIG: GoogleConfig = {
  clientId: "YOUR_IOS_OAUTH_CLIENT_ID.apps.googleusercontent.com"
};

const ANDROID_GOOGLE_CONFIG: GoogleConfig = {
  clientId: "YOUR_ANDROID_OAUTH_CLIENT_ID.apps.googleusercontent.com"
};

export const getPlatformConfig = (): GoogleConfig => {
  if (Capacitor.getPlatform() === 'ios') {
    return IOS_GOOGLE_CONFIG;
  } else if (Capacitor.getPlatform() === 'android') {
    return ANDROID_GOOGLE_CONFIG;
  }
  return WEB_GOOGLE_CONFIG;
};

export const getFirebaseConfig = (): FirebaseConfig => {
  if (Capacitor.getPlatform() === 'ios') {
    return IOS_CONFIG;
  } else if (Capacitor.getPlatform() === 'android') {
    return ANDROID_CONFIG;
  }
  return WEB_CONFIG;
};

export const getGoogleConfig = (): GoogleConfig => {
  if (Capacitor.getPlatform() === 'ios') {
    return IOS_GOOGLE_CONFIG;
  } else if (Capacitor.getPlatform() === 'android') {
    return ANDROID_GOOGLE_CONFIG;
  }
  return WEB_GOOGLE_CONFIG;
};
```

**Where to get the data:**

**Firebase App IDs and Config:**
1. [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → General
3. In "Your apps" section:
   - **Web App**: Copy apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId
   - **iOS App**: Same fields from iOS app config
   - **Android App**: Same fields from Android app config + measurementId

**Google OAuth Client IDs:**
1. [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" → "Credentials"
4. Find OAuth 2.0 Client IDs for:
   - **Web client** (Type: Web application)
   - **iOS client** (Type: iOS)
   - **Android client** (Type: Android)
5. Copy the Client ID for each platform

## 🏃‍♂️ Running the Project

### Web Version
```bash
ionic serve
```

### iOS (requires macOS with Xcode)
```bash
ionic cap build ios
ionic cap open ios
```

### Android (requires Android Studio)
```bash
ionic cap build android
ionic cap open android
```

## 📱 Project Structure

```
MentalGoals/
├── src/
│   ├── app/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Application pages
│   │   ├── services/        # Services (Firebase, Auth, etc.)
│   │   └── config/
│   │       └── firebase.config.ts  # Platform configs (NOT IN GIT)
│   ├── assets/              # Static resources
│   │   ├── data/            # JSON data (habits, challenges)
│   │   ├── i18n/            # Translations
│   │   └── images/          # Images
│   └── environments/        # Environment configuration (NOT IN GIT)
├── GoogleService-Info.plist # iOS Firebase config (NOT IN GIT)
└── google-services.json     # Android Firebase config (NOT IN GIT)
```

## 🔒 Security

**WARNING:** Never commit the following files to git:
- `GoogleService-Info.plist`
- `google-services.json`
- `src/environments/`
- `src/app/config/firebase.config.ts`
- `src/app/config/environment.ts`
- `src/app/config/config.ts`

These files are already added to `.gitignore` and contain sensitive API keys and configuration data.

## 🌍 Languages

The app supports multiple languages:
- Ukrainian 🇺🇦
- English 🇬🇧
- German 🇩🇪

Translation files are located in `src/assets/i18n/`.

## 📄 License

This project is private. All rights reserved.

## 👥 Author

**Valeriya Melnyk** - [GitHub](https://github.com/Valeriya7)

## 📧 Contact

If you have any questions or suggestions, please create an Issue in this repository.
