import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth-service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/']);
  return false;
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  const user = authService.user();
  if (user) {
    const dashboardRoute = getDashboardRoute(user.role);
    router.navigate([dashboardRoute]);
  }

  return false;
};

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = authService.user();

    if (!user) {
      router.navigate(['/']);
      return false;
    }

    if (allowedRoles.includes(user.role)) {
      return true;
    }

    router.navigate(['/unauthorized']);
    return false;
  };
};

function getDashboardRoute(role: string): string {
  const roleRoutes: Record<string, string> = {
    'super_admin': '/super-admin',
    'content_admin': '/content-admin',
    'game_admin': '/game-admin',
    'league_admin': '/league-admin',
    'team_admin': '/team-admin',
  };
  return roleRoutes[role] || '/';
}
