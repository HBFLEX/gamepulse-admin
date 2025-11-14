import { Component, inject } from '@angular/core';
import { NetworkService } from '../../shared/services';

@Component({
  selector: 'app-network-status',
  imports: [],
  template: `
    @if (!networkService.isOnline()) {
      <div class="network-status offline">
        <div class="network-status-content">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 0L0 8L8 16L16 8L8 0Z" fill="currentColor"/>
            <path d="M7 4H9V9H7V4Z" fill="white"/>
            <circle cx="8" cy="11.5" r="1" fill="white"/>
          </svg>
          <span>No internet connection</span>
        </div>
      </div>
    }
  `,
  styles: `
    .network-status {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9998;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease-out;
    }

    .network-status.offline {
      background: #dc3545;
      color: white;
    }

    .network-status-content {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'Bebas Neue', sans-serif;
      font-size: 16px;
      letter-spacing: 1px;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @media (max-width: 768px) {
      .network-status {
        bottom: 10px;
        right: 10px;
        left: 10px;
        padding: 10px 14px;
      }

      .network-status-content {
        font-size: 13px;
      }
    }
  `,
})
export class NetworkStatus {
  readonly networkService = inject(NetworkService);
}
