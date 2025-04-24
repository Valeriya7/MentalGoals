import { Routes } from '@angular/router';
import { AuthGuard } from '../../guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./edit-profile.page').then(m => m.EditProfilePage),
    canActivate: [AuthGuard]
  }
]; 