import { Routes } from '@angular/router';
//import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'questions',
    pathMatch: 'full'
  },
  {
    path: 'questions',
    loadComponent: () => import('./pages/questions/questions.page').then(m => m.QuestionsPage)
  },
  {
    path: 'auth',
    loadComponent: () => import('./pages/auth/auth.page').then(m => m.AuthPage)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./pages/tabs/tabs.routes').then(m => m.routes)
   // canActivate: [AuthGuard]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./pages/notifications/notifications.page').then(m => m.NotificationsPage)
    //canActivate: [AuthGuard]
  },
  {
    path: 'challenges',
    loadComponent: () => import('./pages/challenges/challenges.page').then(m => m.ChallengesPage)
   // canActivate: [AuthGuard]
  }
]; 