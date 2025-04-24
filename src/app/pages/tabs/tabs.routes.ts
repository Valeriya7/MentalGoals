import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { AuthGuard } from '../../guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () => import('../home/home.page').then(m => m.HomePage),
        canActivate: [AuthGuard]
      },
      {
        path: 'challenges',
        loadComponent: () => import('../challenges/challenges.page').then(m => m.ChallengesPage),
        canActivate: [AuthGuard]
      },
      {
        path: 'habits',
        loadComponent: () => import('../habit-tracker/habit-tracker.page').then(m => m.HabitTrackerPage),
        canActivate: [AuthGuard]
      },
      {
        path: 'emotional-calendar',
        loadComponent: () => import('../emotional-calendar/emotional-calendar.page').then(m => m.EmotionalCalendarPage),
        canActivate: [AuthGuard]
      },
      {
        path: 'profile',
        loadComponent: () => import('../profile/profile.page').then(m => m.ProfilePage),
        canActivate: [AuthGuard]
      },
      {
        path: 'edit-profile',
        loadComponent: () => import('../edit-profile/edit-profile.page').then(m => m.EditProfilePage),
        canActivate: [AuthGuard]
      },
      {
        path: 'questions',
        loadComponent: () => import('../questions/questions.page').then(m => m.QuestionsPage)
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full'
  }
]; 