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

### 3. SSL Certificates (optional, for HTTPS in development)

#### Folder `ssl/`
**Location:** `/ssl/` (project root)

If you're using HTTPS for local development, create SSL certificates:

```bash
mkdir ssl
cd ssl
openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
```

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
│   │   └── config/          # Configuration files
│   ├── assets/              # Static resources
│   │   ├── data/            # JSON data (habits, challenges)
│   │   ├── i18n/            # Translations
│   │   └── images/          # Images
│   └── environments/        # Environment configuration (NOT IN GIT)
├── GoogleService-Info.plist # iOS Firebase config (NOT IN GIT)
├── google-services.json     # Android Firebase config (NOT IN GIT)
└── ssl/                     # SSL certificates (NOT IN GIT)
```

## 🔒 Security

**WARNING:** Never commit the following files to git:
- `GoogleService-Info.plist`
- `google-services.json`
- `src/environments/`
- `ssl/`

These files are already added to `.gitignore`.

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
