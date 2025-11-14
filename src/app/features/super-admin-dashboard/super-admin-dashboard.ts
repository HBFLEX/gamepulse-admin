import { Component, inject } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import { AuthService } from '../auth/services/auth-service';

@Component({
  selector: 'app-super-admin-dashboard',
  imports: [TuiButton],
  templateUrl: './super-admin-dashboard.html',
  styleUrl: './super-admin-dashboard.less',
})
export class SuperAdminDashboard {
  readonly authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
