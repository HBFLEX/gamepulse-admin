import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';

@Component({
  selector: 'app-user-bulk-actions',
  imports: [
    CommonModule,
    TuiButton,
    TuiIcon,
    TuiCardLarge,
  ],
  template: `
    @if (selectedCount() > 0) {
      <div tuiCardLarge class="bulk-actions-section">
        <div class="bulk-actions-content">
          <div class="selection-info">
            <span class="selection-count">{{ selectedCount() }} user(s) selected</span>
          </div>
          <div class="bulk-buttons">
            <button
              tuiButton
              appearance="secondary"
              size="s"
              (click)="activateUsers.emit()"
            >
              <tui-icon icon="@tui.check-circle" />
              Activate
            </button>
            <button
              tuiButton
              appearance="secondary"
              size="s"
              (click)="deactivateUsers.emit()"
            >
              <tui-icon icon="@tui.x-circle" />
              Deactivate
            </button>
            <button
              tuiButton
              appearance="destructive"
              size="s"
              (click)="deleteUsers.emit()"
            >
              <tui-icon icon="@tui.trash" />
              Delete
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .bulk-actions-section {
      .bulk-actions-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;

        .selection-info {
          .selection-count {
            font-weight: 600;
            color: var(--tui-text-primary);
          }
        }

        .bulk-buttons {
          display: flex;
          gap: 0.75rem;
        }
      }
    }

    @media (max-width: 768px) {
      .bulk-actions-section .bulk-actions-content {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }
    }
  `],
})
export class UserBulkActionsComponent {
  // Inputs
  selectedCount = input<number>(0);

  // Outputs
  activateUsers = output<void>();
  deactivateUsers = output<void>();
  deleteUsers = output<void>();
}