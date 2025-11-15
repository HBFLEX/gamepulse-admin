import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./game-admin-dashboard').then((m) => m.GameAdminDashboard),
  },
];
