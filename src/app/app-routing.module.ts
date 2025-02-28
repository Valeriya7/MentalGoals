import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { QuestionsPage } from './pages/questions/questions.page'; // Імпортуємо QuestionsPage
import { TabsPage } from './pages/tabs/tabs.page';

/*{
  path: '',
  redirectTo: 'tabs/home',
  //component: QuestionsPage, //component: QuestionsPage,
  //redirectTo: 'questions',
  pathMatch: 'full'
},*/
const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./pages/tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'questions',
    loadChildren: () => import('./pages/questions/questions.module').then( m => m.QuestionsPageModule)
  },
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.module').then(m => m.AuthPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
