import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full',
  },
  {
    path: 'overview',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent),
  },

  {
    path: 'admins',
    loadComponent: () =>
      import('./pages/admin-management/admin-management').then((m) => m.AdminManagement),
  },
   {
     path: 'users',
     loadComponent: () =>
       import('./pages/user-management/user-management').then((m) => m.UserManagement),
   },
  {
    path: 'roles',
    loadComponent: () =>
      import('./pages/roles/roles.component').then((m) => m.RolesComponent),
  },
  {
    path: 'teams',
    loadComponent: () =>
      import('./pages/teams/teams.component').then((m) => m.TeamsComponent),
  },
  {
    path: 'players',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'coaches',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'seasons',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'schedule',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'live',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'results',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'locations',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'player-stats',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'team-stats',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'standings',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'news',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'stories',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'moments',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'banners',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'hero',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'traffic',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'engagement',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'media',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'notifications',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'logs',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'cache',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
];
