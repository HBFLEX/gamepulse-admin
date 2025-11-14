import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';

@Component({
  selector: 'app-unauthorized',
  imports: [TuiButton],
  template: `
    <div class="unauthorized-container">
      <div class="unauthorized-content">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="50" fill="#fee2e2"/>
          <path d="M60 35v30M60 75h.01" stroke="#dc2626" stroke-width="6" stroke-linecap="round"/>
        </svg>
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        <button tuiButton appearance="primary" size="l" (click)="goBack()">
          Go Back
        </button>
      </div>
    </div>
  `,
  styles: `
    .unauthorized-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: #f9fafb;
    }

    .unauthorized-content {
      text-align: center;
      max-width: 400px;
    }

    svg {
      margin-bottom: 24px;
    }

    h1 {
      font-size: 32px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 12px;
    }

    p {
      font-size: 16px;
      color: #6b7280;
      margin: 0 0 32px;
    }
  `,
})
export class Unauthorized {
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/']);
  }
}
