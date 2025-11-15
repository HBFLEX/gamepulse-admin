import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./content-admin-dashboard').then((m) => m.ContentAdminDashboard),
  },
];
