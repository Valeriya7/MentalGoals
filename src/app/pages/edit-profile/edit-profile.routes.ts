import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./edit-profile.page').then(m => m.EditProfilePage)
  }
]; 