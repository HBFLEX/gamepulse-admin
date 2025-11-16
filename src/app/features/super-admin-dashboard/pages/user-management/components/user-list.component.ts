import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiButton, TuiIcon, TuiLoader, TuiHint } from '@taiga-ui/core';
import { TuiAvatar } from '@taiga-ui/kit';
import { TuiCardLarge } from '@taiga-ui/layout';
import { TuiTable } from '@taiga-ui/addon-table';
import { User } from '../../../../../core/models/user-management.model';

@Component({
  selector: 'app-user-list',
  imports: [
    CommonModule,
    TuiButton,
    TuiIcon,
    TuiLoader,
    TuiAvatar,
    TuiCardLarge,
    TuiTable,
    TuiHint,
  ],
  template: `
    <div tuiCardLarge class="table-section">
      @if (loading()) {
        <div class="loading-state">
          <tui-loader size="m"></tui-loader>
          <p>Loading users...</p>
        </div>
      } @else if (users().length === 0) {
        <div class="empty-state">
          <tui-icon icon="@tui.users" class="empty-icon" />
          <h3>No users found</h3>
          <p>Try adjusting your filters or create a new user</p>
          <button
            tuiButton
            appearance="primary"
            size="m"
            (click)="createUser.emit()"
          >
            <tui-icon icon="@tui.plus" />
            Add User
          </button>
        </div>
      } @else {
        <div class="table-wrapper">
          <table tuiTable [columns]="columns" class="users-table">
            <thead>
              <tr tuiThGroup>
                <th tuiTh class="checkbox-column">
                  <input
                    type="checkbox"
                    class="select-checkbox"
                    [checked]="isAllSelected()"
                    [indeterminate]="isSomeSelected()"
                    (change)="toggleSelectAll.emit()"
                  />
                </th>
                <th *tuiHead="'avatar'" tuiTh>Avatar</th>
                <th *tuiHead="'name'" tuiTh
                    [class.sortable]="true"
                    [class.sort-asc]="sortColumn() === 'name' && sortDirection() === 'asc'"
                    [class.sort-desc]="sortColumn() === 'name' && sortDirection() === 'desc'"
                    (click)="sort.emit('name')">
                  Name
                  <tui-icon icon="@tui.chevron-down" class="sort-icon" />
                </th>
                <th *tuiHead="'email'" tuiTh
                    [class.sortable]="true"
                    [class.sort-asc]="sortColumn() === 'email' && sortDirection() === 'asc'"
                    [class.sort-desc]="sortColumn() === 'email' && sortDirection() === 'desc'"
                    (click)="sort.emit('email')">
                  Email
                  <tui-icon icon="@tui.chevron-down" class="sort-icon" />
                </th>
                <th *tuiHead="'status'" tuiTh
                    [class.sortable]="true"
                    [class.sort-asc]="sortColumn() === 'status' && sortDirection() === 'asc'"
                    [class.sort-desc]="sortColumn() === 'status' && sortDirection() === 'desc'"
                    (click)="sort.emit('status')">
                  Status
                  <tui-icon icon="@tui.chevron-down" class="sort-icon" />
                </th>
                <th *tuiHead="'verification'" tuiTh
                    [class.sortable]="true"
                    [class.sort-asc]="sortColumn() === 'verification' && sortDirection() === 'asc'"
                    [class.sort-desc]="sortColumn() === 'verification' && sortDirection() === 'desc'"
                    (click)="sort.emit('verification')">
                  Verification
                  <tui-icon icon="@tui.chevron-down" class="sort-icon" />
                </th>
                <th *tuiHead="'favoriteTeam'" tuiTh
                    [class.sortable]="true"
                    [class.sort-asc]="sortColumn() === 'favoriteTeam' && sortDirection() === 'asc'"
                    [class.sort-desc]="sortColumn() === 'favoriteTeam' && sortDirection() === 'desc'"
                    (click)="sort.emit('favoriteTeam')">
                  Favorite Team
                  <tui-icon icon="@tui.chevron-down" class="sort-icon" />
                </th>
                <th *tuiHead="'created'" tuiTh
                    [class.sortable]="true"
                    [class.sort-asc]="sortColumn() === 'created' && sortDirection() === 'asc'"
                    [class.sort-desc]="sortColumn() === 'created' && sortDirection() === 'desc'"
                    (click)="sort.emit('created')">
                  Created
                  <tui-icon icon="@tui.chevron-down" class="sort-icon" />
                </th>
                <th *tuiHead="'lastLogin'" tuiTh
                    [class.sortable]="true"
                    [class.sort-asc]="sortColumn() === 'lastLogin' && sortDirection() === 'asc'"
                    [class.sort-desc]="sortColumn() === 'lastLogin' && sortDirection() === 'desc'"
                    (click)="sort.emit('lastLogin')">
                  Last Login
                  <tui-icon icon="@tui.chevron-down" class="sort-icon" />
                </th>
                <th *tuiHead="'actions'" tuiTh>Actions</th>
              </tr>
            </thead>
            <tbody tuiTbody [data]="users()">
              @for (user of users(); track user.id) {
                <tr tuiTr>
                  <td class="checkbox-column">
                    <input
                      type="checkbox"
                      class="select-checkbox"
                      [checked]="isUserSelected(user.id)"
                      (change)="toggleSelectUser.emit(user.id)"
                    />
                  </td>
                  <td *tuiCell="'avatar'">
                    <tui-avatar size="m" [src]="user.profile?.avatar_url">
                      {{ getInitials(user.fullName) }}
                    </tui-avatar>
                  </td>
                  <td *tuiCell="'name'">
                    <div class="user-name-cell">
                      <span class="user-name">{{ user.fullName }}</span>
                      @if (user.username) {
                        <span class="user-username">@@{{ user.username }}</span>
                      }
                    </div>
                  </td>
                  <td *tuiCell="'email'">
                    <span class="user-email">{{ user.email }}</span>
                  </td>
                  <td *tuiCell="'status'">
                    <button
                      tuiIconButton
                      appearance="icon"
                      size="s"
                      [tuiHint]="user.isActive ? 'Deactivate user' : 'Activate user'"
                      (click)="toggleUserStatus.emit(user)"
                    >
                      <tui-icon [icon]="user.isActive ? '@tui.check-circle' : '@tui.x-circle'" />
                    </button>
                  </td>
                  <td *tuiCell="'verification'">
                    <span class="verification-badge" [class]="'verification-' + (user.isVerified ? 'verified' : 'unverified')">
                      {{ user.isVerified ? 'Verified' : 'Unverified' }}
                    </span>
                  </td>
                  <td *tuiCell="'favoriteTeam'">
                    <span class="favorite-team">
                      {{ getFavoriteTeamDisplay(user) }}
                    </span>
                  </td>
                  <td *tuiCell="'created'">
                    <span class="date-cell">{{ formatDate(user.createdAt) }}</span>
                  </td>
                  <td *tuiCell="'lastLogin'">
                    <span class="date-cell">{{ formatDate(user.lastLogin || '') }}</span>
                  </td>
                  <td *tuiCell="'actions'">
                    <div class="actions-cell">
                      <button
                        tuiIconButton
                        appearance="icon"
                        size="s"
                        tuiHint="Edit user"
                        (click)="editUser.emit(user)"
                      >
                        <tui-icon icon="@tui.edit" />
                      </button>
                      <button
                        tuiIconButton
                        appearance="icon"
                        size="s"
                        tuiHint="Delete user"
                        (click)="deleteUser.emit(user)"
                      >
                        <tui-icon icon="@tui.trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="pagination-section">
            <div class="pagination-info">
              <span class="total-info">{{ totalUsers() }} total users</span>
              <span class="page-info">Page {{ currentPage() }} of {{ totalPages() }}</span>
            </div>
            <div class="pagination-controls">
              <button
                tuiButton
                appearance="secondary"
                size="s"
                [disabled]="currentPage() === 1 || loading()"
                (click)="previousPage.emit()"
              >
                <tui-icon icon="@tui.chevron-left" />
                Previous
              </button>
              <button
                tuiButton
                appearance="secondary"
                size="s"
                [disabled]="!hasMore() || loading()"
                (click)="nextPage.emit()"
              >
                Next
                <tui-icon icon="@tui.chevron-right" />
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .table-section {
      padding: 1.5rem;

      .loading-state,
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 3rem;
        text-align: center;
      }

      .empty-icon {
        font-size: 4rem;
        color: var(--tui-text-tertiary);
      }

      .table-wrapper {
        overflow-x: auto;
      }

      .users-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;

        th {
          text-align: left;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 0.875rem;
          letter-spacing: 1px;
          color: var(--tui-text-secondary);
          padding: 0.75rem;
          border-bottom: 2px solid var(--tui-border-normal);
          position: relative;

          &.sortable {
            cursor: pointer;
            user-select: none;

            &:hover {
              background: var(--tui-background-elevation-1);
            }

            .sort-icon {
              margin-left: 0.5rem;
              opacity: 0.5;
              transition: opacity 0.2s;
            }

            &.sort-asc .sort-icon,
            &.sort-desc .sort-icon {
              opacity: 1;
              transform: rotate(180deg);
            }

            &.sort-asc .sort-icon {
              transform: none;
            }
          }
        }

        td {
          padding: 0.75rem;
          border-bottom: 1px solid var(--tui-border-normal);
          vertical-align: middle;
        }

        tr:hover {
          background: var(--tui-background-elevation-1);
        }

        .checkbox-column {
          width: 40px;
          text-align: center;
        }

        .select-checkbox {
          margin: 0;
        }

        .user-name-cell {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;

          .user-name {
            font-weight: 500;
            color: var(--tui-text-primary);
          }

          .user-username {
            font-size: 0.75rem;
            color: var(--tui-text-secondary);
          }
        }

        .user-email {
          color: var(--tui-text-secondary);
        }

        .verification-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;

          &.verification-verified {
            background: rgba(34, 197, 94, 0.1);
            color: #22c55e;
          }

          &.verification-unverified {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
          }
        }

        .favorite-team {
          font-size: 0.875rem;
          color: var(--tui-text-primary);
        }

        .date-cell {
          font-size: 0.813rem;
          color: var(--tui-text-secondary);
          white-space: nowrap;
        }

        .actions-cell {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }
      }

      .pagination-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--tui-border-normal);

        .pagination-info {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;

          .total-info {
            font-weight: 600;
            color: var(--tui-text-primary);
          }

          .page-info {
            color: var(--tui-text-secondary);
          }
        }

        .pagination-controls {
          display: flex;
          gap: 0.75rem;
        }
      }
    }

    @media (max-width: 768px) {
      .table-section .users-table {
        font-size: 0.75rem;

        th,
        td {
          padding: 0.5rem;
        }

        .actions-cell {
          flex-direction: column;
          gap: 0.25rem;
        }
      }

      .pagination-section {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }
    }
  `],
})
export class UserListComponent {
  // Inputs
  users = input<User[]>([]);
  loading = input<boolean>(false);
  selectedUserIds = input<Set<string>>(new Set());
  sortColumn = input<string>('');
  sortDirection = input<'asc' | 'desc'>('asc');
  currentPage = input<number>(1);
  totalUsers = input<number>(0);
  hasMore = input<boolean>(false);

  // Computed
  readonly columns = ['select', 'avatar', 'name', 'email', 'status', 'verification', 'favoriteTeam', 'created', 'lastLogin', 'actions'];

  readonly totalPages = computed(() => Math.ceil(this.totalUsers() / 20)); // Assuming 20 per page

  readonly isAllSelected = computed(() => {
    const users = this.users();
    return users.length > 0 && users.every(user => this.selectedUserIds().has(user.id));
  });

  readonly isSomeSelected = computed(() => {
    return this.selectedUserIds().size > 0 && !this.isAllSelected();
  });

  // Outputs
  createUser = output<void>();
  editUser = output<User>();
  deleteUser = output<User>();
  toggleSelectAll = output<void>();
  toggleSelectUser = output<string>();
  toggleUserStatus = output<User>();
  sort = output<string>();
  previousPage = output<void>();
  nextPage = output<void>();

  isUserSelected(userId: string): boolean {
    return this.selectedUserIds().has(userId);
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getFavoriteTeamDisplay(user: User): string {
    if (user.profile?.favorite_team) {
      const team = user.profile.favorite_team;
      return `${team.city || ''} ${team.name || ''}`.trim() || '-';
    }
    return '-';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}