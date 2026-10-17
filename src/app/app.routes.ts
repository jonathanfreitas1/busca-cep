import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () => import('./features/home/home.routes'),
  },
  {
    path: 'enderecos',
    loadChildren: () => import('./features/cep/cep.routes'),
  },
  { path: '**', redirectTo: '' },
];
