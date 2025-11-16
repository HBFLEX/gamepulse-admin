import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { User } from '../../../../../core/models/user-management.model';

@Component({
  selector: 'app-user-delete-modal',
  imports: [
    CommonModule,
    TuiButton,
    TuiIcon,
  ],
  template: `
    @if (showModal()) {
      <div class="modal-overlay" (click)="close.emit()">
        <div class="modal-content delete-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">Delete User</h3>
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
            @if (error()) {
              <div class="error-message">
                <tui-icon icon="@tui.alert-circle" />
                {{ error() }}
              </div>
            }

            <div class="delete-confirmation">
              <tui-icon icon="@tui.alert-triangle" class="warning-icon" />
              <h4>Are you sure you want to delete this user?</h4>
              <p>This action cannot be undone. The user will be permanently removed from the system.</p>
              @if (user()) {
                <div class="user-info">
                  <strong>{{ user()!.fullName }}</strong><br>
                  <small>{{ user()!.email }}</small>
                </div>
              }
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
              appearance="destructive"
              size="m"
              (click)="confirm.emit()"
            >
              Delete User
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

      &.delete-modal {
        max-width: 500px;
      }
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

      .error-message {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: 0.5rem;
        color: #ef4444;
        font-size: 0.875rem;
        margin-bottom: 1.5rem;

        tui-icon {
          flex-shrink: 0;
        }
      }

      .delete-confirmation {
        text-align: center;
        padding: 2rem;

        .warning-icon {
          font-size: 3rem;
          color: #ef4444;
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

        .user-info {
          background: var(--tui-background-elevation-1);
          padding: 1rem;
          border-radius: 0.5rem;
          margin-top: 1rem;

          strong {
            color: var(--tui-text-primary);
          }

          small {
            color: var(--tui-text-secondary);
          }
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
export class UserDeleteModalComponent {
  // Inputs
  showModal = input<boolean>(false);
  user = input<User | null>(null);
  error = input<string | null>(null);

  // Outputs
  close = output<void>();
  confirm = output<void>();
}