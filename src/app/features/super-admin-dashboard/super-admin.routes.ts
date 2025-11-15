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
  // Placeholder routes for future pages
  {
    path: 'admins',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'roles',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
  },
  {
    path: 'teams',
    loadComponent: () =>
      import('./pages/overview/overview.component').then((m) => m.OverviewComponent), // TODO: Replace with actual component
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
