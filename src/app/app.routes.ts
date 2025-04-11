import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadComponent: () => import('./pages/auth/auth.page').then(m => m.AuthPage)
  },
  {
    path: 'questions',
    loadComponent: () => import('./pages/questions/questions.page').then(m => m.QuestionsPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'strava-callback',
    loadComponent: () => import('./pages/strava-callback/strava-callback.page').then(m => m.StravaCallbackPage)
  },
  {
    path: 'tabs',
    loadComponent: () => import('./pages/tabs/tabs.page').then(m => m.TabsPage),
    canActivate: [AuthGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage)
      },
      {
        path: 'challenges',
        loadComponent: () => import('./pages/challenges/challenges.page').then(m => m.ChallengesPage)
      },
      {
        path: 'habits',
        loadComponent: () => import('./pages/habit-tracker/habit-tracker.page').then(m => m.HabitTrackerPage)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./pages/notifications/notifications.page').then(m => m.NotificationsPage)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage)
      },
      {
        path: 'emotional-calendar',
        loadComponent: () => import('./pages/emotional-calendar/emotional-calendar.page').then(m => m.EmotionalCalendarPage)
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'challenge-details/:id',
    loadComponent: () => import('./pages/challenge-details/challenge-details.page').then(m => m.ChallengeDetailsPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'life-wheel',
    loadComponent: () => import('./pages/life-wheel/life-wheel.page').then(m => m.LifeWheelPage),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: 'auth'
  }
];
