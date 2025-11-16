import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiButton, TuiIcon, TuiLoader } from '@taiga-ui/core';

@Component({
  selector: 'app-user-bulk-status-modal',
  imports: [
    CommonModule,
    TuiButton,
    TuiIcon,
    TuiLoader,
  ],
  template: `
    @if (showModal()) {
      <div class="modal-overlay" (click)="close.emit()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">{{ action() === 'activate' ? 'Activate' : 'Deactivate' }} Users</h3>
            <button
              tuiIconButton
              appearance="icon"
              size="s"
              (click)="close.emit()"
            >
              <tui-icon icon="@tui.x" />
            </button>
          </div>

          <div class="modal-body">
            <div class="status-update-confirmation">
              <tui-icon icon="@tui.info" class="info-icon" />
              <h4>Are you sure you want to {{ action() }} {{ selectedCount() }} user(s)?</h4>
              <p>This will {{ action() }} all selected user accounts.</p>
            </div>
          </div>

          <div class="modal-footer">
            <button
              tuiButton
              appearance="secondary"
              size="m"
              (click)="close.emit()"
            >
              Cancel
            </button>
            <button
              tuiButton
              appearance="primary"
              size="m"
              (click)="confirm.emit()"
              [disabled]="loading()"
            >
              @if (loading()) {
                <tui-loader size="s" />
              } @else {
                {{ action() === 'activate' ? 'Activate' : 'Deactivate' }} Users
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: var(--tui-background-base);
      border-radius: 1rem;
      max-width: 500px;
      width: 100%;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid var(--tui-border-normal);

      .modal-title {
        font-family: 'Bebas Neue', sans-serif;
        font-size: 1.5rem;
        letter-spacing: 1px;
        color: var(--tui-text-primary);
        margin: 0;
      }
    }

    .modal-body {
      padding: 1.5rem;

      .status-update-confirmation {
        text-align: center;
        padding: 2rem;

        .info-icon {
          font-size: 3rem;
          color: #3b82f6;
          margin-bottom: 1rem;
        }

        h4 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.25rem;
          letter-spacing: 1px;
          color: var(--tui-text-primary);
          margin: 1rem 0 0.5rem 0;
        }

        p {
          color: var(--tui-text-secondary);
          margin: 0.5rem 0 1rem 0;
        }
      }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid var(--tui-border-normal);
    }

    @media (max-width: 768px) {
      .modal-content {
        max-width: 95vw;
        margin: 1rem;
      }
    }
  `],
})
export class UserBulkStatusModalComponent {
  // Inputs
  showModal = input<boolean>(false);
  action = input<'activate' | 'deactivate'>('activate');
  selectedCount = input<number>(0);
  loading = input<boolean>(false);

  // Outputs
  close = output<void>();
  confirm = output<void>();
}