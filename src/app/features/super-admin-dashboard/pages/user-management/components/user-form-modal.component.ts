import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiIcon, TuiLabel, TuiTextfield, TuiLoader } from '@taiga-ui/core';
import { CreateUserDto, UpdateUserDto, User } from '../../../../../core/models/user-management.model';

interface Team {
  id: number;
  name: string;
  city?: string;
}

@Component({
  selector: 'app-user-form-modal',
  imports: [
    CommonModule,
    FormsModule,
    TuiButton,
    TuiIcon,
    TuiLabel,
    TuiTextfield,
    TuiLoader,
  ],
  template: `
    @if (showModal()) {
      <div class="modal-overlay" (click)="close.emit()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">{{ isEditMode() ? 'Edit User' : 'Create New User' }}</h3>
            <button
              tuiIconButton
              appearance="icon"
              size="s"
              (click)="close.emit()"
            >
              <tui-icon icon="@tui.x" />
            </button>
          </div>

          <form class="modal-body" (ngSubmit)="onSubmit()">
            @if (error()) {
              <div class="error-message">
                <tui-icon icon="@tui.alert-circle" />
                {{ error() }}
              </div>
            }

            <div class="form-grid">
              <div class="form-group">
                <label tuiLabel>Full Name *</label>
                <tui-textfield>
                  <input
                    tuiTextfield
                    type="text"
                    placeholder="Enter full name"
                    [(ngModel)]="formData().fullName"
                    name="fullName"
                    required
                  />
                </tui-textfield>
              </div>

              <div class="form-group">
                <label tuiLabel>Username</label>
                <tui-textfield>
                  <input
                    tuiTextfield
                    type="text"
                    placeholder="Enter username"
                    [(ngModel)]="formData().username"
                    name="username"
                  />
                </tui-textfield>
              </div>

              @if (!isEditMode()) {
                <div class="form-group">
                  <label tuiLabel>Email *</label>
                  <tui-textfield>
                    <input
                      tuiTextfield
                      type="email"
                      placeholder="Enter email address"
                      [(ngModel)]="formData().email"
                      name="email"
                      required
                    />
                  </tui-textfield>
                </div>

                <div class="form-group">
                  <label tuiLabel>Password *</label>
                  <tui-textfield>
                    <input
                      tuiTextfield
                      type="password"
                      placeholder="Enter password"
                      [(ngModel)]="formData().password"
                      name="password"
                      required
                    />
                  </tui-textfield>
                </div>
              }

              <div class="form-group">
                <label tuiLabel>Favorite Team</label>
                <select
                  class="form-select"
                  [(ngModel)]="formData().favoriteTeamId"
                  name="favoriteTeamId"
                >
                  <option [value]="undefined">Select a team</option>
                  <option *ngFor="let team of teams()" [value]="team.id">{{ team.city }} {{ team.name }}</option>
                </select>
              </div>

              @if (isEditMode()) {
                <div class="form-group">
                  <label tuiLabel>Avatar URL</label>
                  <tui-textfield>
                    <input
                      tuiTextfield
                      type="url"
                      placeholder="Enter avatar URL"
                      [(ngModel)]="formData().avatar_url"
                      name="avatar_url"
                    />
                  </tui-textfield>
                </div>

                <div class="form-group full-width">
                  <label tuiLabel>Bio</label>
                  <textarea
                    class="form-textarea"
                    placeholder="Enter user bio"
                    [(ngModel)]="formData().bio"
                    name="bio"
                    rows="3"
                  ></textarea>
                </div>

                <div class="form-group">
                  <label tuiLabel>Status</label>
                  <tui-switch
                    [(ngModel)]="formData().isActive"
                    name="isActive"
                  />
                  <span class="switch-label">{{ formData().isActive ? 'Active' : 'Inactive' }}</span>
                </div>

                <div class="form-group">
                  <label tuiLabel>Notifications</label>
                  <tui-switch
                    [(ngModel)]="formData().notifications_enabled"
                    name="notifications_enabled"
                  />
                  <span class="switch-label">{{ formData().notifications_enabled ? 'Enabled' : 'Disabled' }}</span>
                </div>
              }
            </div>

            <div class="modal-footer">
              <button
                tuiButton
                appearance="secondary"
                size="m"
                type="button"
                (click)="close.emit()"
              >
                Cancel
              </button>
              <button
                tuiButton
                appearance="primary"
                size="m"
                type="submit"
                [disabled]="loading()"
              >
                @if (loading()) {
                  <tui-loader size="s" />
                } @else {
                  {{ isEditMode() ? 'Update User' : 'Create User' }}
                }
              </button>
            </div>
          </form>
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
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
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
      flex: 1;
      overflow-y: auto;
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

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;

          &.full-width {
            grid-column: 1 / -1;
          }
        }

        .form-select {
          padding: 0.5rem;
          border: 1px solid var(--tui-border-normal);
          border-radius: 0.375rem;
          background: var(--tui-background-base);
          color: var(--tui-text-primary);
          font-size: 0.875rem;
          width: 100%;
        }

        .form-textarea {
          padding: 0.5rem;
          border: 1px solid var(--tui-border-normal);
          border-radius: 0.375rem;
          background: var(--tui-background-base);
          color: var(--tui-text-primary);
          font-size: 0.875rem;
          width: 100%;
          resize: vertical;
          font-family: inherit;
        }

        .switch-label {
          font-size: 0.875rem;
          color: var(--tui-text-secondary);
          margin-left: 0.5rem;
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

      .modal-body .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class UserFormModalComponent {
  // Inputs
  showModal = input<boolean>(false);
  isEditMode = input<boolean>(false);
  loading = input<boolean>(false);
  error = input<string | null>(null);
  teams = input<Team[]>([]);
  user = input<User | null>(null);

  // Internal state
  formData = signal<CreateUserDto & Partial<UpdateUserDto>>({
    email: '',
    password: '',
    fullName: '',
    username: '',
    favoriteTeamId: undefined,
    isActive: true,
    notifications_enabled: true,
  });

  // Outputs
  close = output<void>();
  submit = output<CreateUserDto & Partial<UpdateUserDto>>();

  ngOnChanges() {
    if (this.showModal() && this.isEditMode() && this.user()) {
      const user = this.user()!;
      this.formData.set({
        fullName: user.fullName,
        username: user.username || '',
        isActive: user.isActive,
        favoriteTeamId: user.profile?.favorite_team_id,
        avatar_url: user.profile?.avatar_url || '',
        bio: user.profile?.bio || '',
        notifications_enabled: user.profile?.notifications_enabled ?? true,
      } as any);
    } else if (this.showModal() && !this.isEditMode()) {
      this.formData.set({
        email: '',
        password: '',
        fullName: '',
        username: '',
        favoriteTeamId: undefined,
      } as any);
    }
  }

  onSubmit(): void {
    if (this.isEditMode()) {
      // For edit mode, only send the fields that can be updated
      const updateData: Partial<UpdateUserDto> = {
        fullName: this.formData().fullName,
        username: this.formData().username,
        isActive: this.formData().isActive,
        favoriteTeamId: this.formData().favoriteTeamId,
        avatar_url: this.formData().avatar_url,
        bio: this.formData().bio,
        notifications_enabled: this.formData().notifications_enabled,
      };
      this.submit.emit(updateData as any);
    } else {
      // For create mode, send all required fields
      const createData: CreateUserDto = {
        email: this.formData().email!,
        password: this.formData().password!,
        fullName: this.formData().fullName!,
        username: this.formData().username,
        favoriteTeamId: this.formData().favoriteTeamId,
      };
      this.submit.emit(createData as any);
    }
  }
}
