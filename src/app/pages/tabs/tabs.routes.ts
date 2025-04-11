import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () => import('../home/home.page').then(m => m.HomePage)
      },
      {
        path: 'challenges',
        loadComponent: () => import('../challenges/challenges.page').then(m => m.ChallengesPage)
      },
      {
        path: 'habits',
        loadComponent: () => import('../habit-tracker/habit-tracker.page').then(m => m.HabitTrackerPage)
      },
      {
        path: 'emotional-calendar',
        loadComponent: () => import('../emotional-calendar/emotional-calendar.page').then(m => m.EmotionalCalendarPage)
      },
      {
        path: 'profile',
        loadComponent: () => import('../profile/profile.page').then(m => m.ProfilePage)
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  }
]; 