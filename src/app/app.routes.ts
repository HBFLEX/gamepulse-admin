import { Routes } from '@angular/router';
import { Auth } from './features/auth/auth';
import { authGuard, roleGuard, guestGuard } from './core/guards';
import { AdminRole } from './core/shared/models';

export const routes: Routes = [
  {
    path: '',
    component: Auth,
    pathMatch: 'full',
    canActivate: [guestGuard],
  },
  {
    path: 'super-admin',
    loadComponent: () =>
      import('./features/super-admin-dashboard/super-admin-dashboard').then((m) => m.SuperAdminDashboard),
    canActivate: [authGuard, roleGuard([AdminRole.SUPER_ADMIN])],
  },
  {
    path: 'content-admin',
    loadChildren: () =>
      import('./features/content-admin-dashboard/content-admin.routes').then((m) => m.routes),
    canActivate: [authGuard, roleGuard([AdminRole.SUPER_ADMIN, AdminRole.CONTENT_ADMIN])],
  },
  {
    path: 'game-admin',
    loadChildren: () =>
      import('./features/game-admin-dashboard/game-admin.routes').then((m) => m.routes),
    canActivate: [authGuard, roleGuard([AdminRole.SUPER_ADMIN, AdminRole.GAME_ADMIN])],
  },
  {
    path: 'league-admin',
    loadChildren: () =>
      import('./features/league-admin-dashboard/league-admin.routes').then((m) => m.routes),
    canActivate: [authGuard, roleGuard([AdminRole.SUPER_ADMIN, AdminRole.LEAGUE_ADMIN])],
  },
  {
    path: 'team-admin',
    loadChildren: () =>
      import('./features/team-admin-dashboard/team-admin.routes').then((m) => m.routes),
    canActivate: [authGuard, roleGuard([AdminRole.SUPER_ADMIN, AdminRole.TEAM_ADMIN])],
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./core/components/unauthorized/unauthorized').then((m) => m.Unauthorized),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
