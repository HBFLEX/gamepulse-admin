import { Component, inject } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import { AuthService } from '../auth/services/auth-service';

@Component({
  selector: 'app-content-admin-dashboard',
  imports: [TuiButton],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Content Admin Dashboard</h1>
        <button tuiButton appearance="secondary" size="m" (click)="logout()">
          Logout
        </button>
      </div>
      <p>Welcome {{ authService.user()?.firstName }} {{ authService.user()?.lastName }}!</p>
      <p>Email: {{ authService.user()?.email }}</p>
      <p>Role: {{ authService.user()?.role }}</p>
    </div>
  `,
  styles: `
    .dashboard-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    h1 {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 40px;
      letter-spacing: 2px;
      margin: 0;
    }

    p {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 18px;
      letter-spacing: 1px;
      margin: 8px 0;
    }

    button {
      font-family: 'Bebas Neue', sans-serif;
      letter-spacing: 1.5px;
    }

    @media (max-width: 768px) {
      .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
    }
  `,
})
export class ContentAdminDashboard {
  readonly authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
