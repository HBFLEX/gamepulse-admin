import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiIcon, TuiLabel, TuiLoader } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { TuiTable } from '@taiga-ui/addon-table';
import { AdminManagementApiService } from '../../../../../core/services/admin-management-api-service';
import { AdminUser } from '../../../../../core/models/admin-management.model';

@Component({
  selector: 'app-audit-logs-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TuiButton,
    TuiIcon,
    TuiLabel,
    TuiLoader,
    TuiCardLarge,
    TuiTable,
  ],
  template: `
    <div class="audit-logs-tab">
      <!-- Filters -->
      <div tuiCardLarge class="filters-card">
        <div class="filters-grid">
          <div class="filter-group">
            <label tuiLabel>Role</label>
            <select
              class="filter-select"
              [(ngModel)]="roleFilter"
              (ngModelChange)="onFilterChange()"
            >
              <option value="">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="league_admin">League Admin</option>
              <option value="team_admin">Team Admin</option>
              <option value="content_admin">Content Admin</option>
              <option value="game_admin">Game Admin</option>
            </select>
          </div>

          <div class="filter-group">
            <label tuiLabel>Status</label>
            <select
              class="filter-select"
              [(ngModel)]="statusFilter"
              (ngModelChange)="onFilterChange()"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div class="filter-actions">
            <button
              tuiButton
              appearance="secondary"
              size="s"
              (click)="clearFilters()"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Admin Activity Table -->
      <div tuiCardLarge class="logs-card">
        @if (loading()) {
          <div class="loading-state">
            <tui-loader size="xl"></tui-loader>
            <p>Loading admin activity...</p>
          </div>
        } @else if (error()) {
          <div class="error-state">
            <tui-icon icon="@tui.alert-circle" class="error-icon" />
            <p class="error-title">Failed to Load Admin Activity</p>
            <p class="error-message">{{ error() }}</p>
            <button
              tuiButton
              appearance="primary"
              size="m"
              (click)="loadLogs()"
            >
              <tui-icon icon="@tui.rotate-cw" />
              Retry
            </button>
          </div>
        } @else if (admins().length === 0) {
          <div class="empty-state">
            <tui-icon icon="@tui.users" class="empty-icon" />
            <p class="empty-title">No Admin Users Found</p>
            <p class="empty-subtitle">Try adjusting your filters</p>
          </div>
        } @else {
          <div class="table-wrapper">
            <table tuiTable [columns]="columns" class="audit-table">
              <thead>
                <tr tuiThGroup>
                  <th *tuiHead="'admin'" tuiTh>Admin</th>
                  <th *tuiHead="'email'" tuiTh>Email</th>
                  <th *tuiHead="'role'" tuiTh>Role</th>
                  <th *tuiHead="'status'" tuiTh>Status</th>
                  <th *tuiHead="'lastLogin'" tuiTh>Last Login</th>
                  <th *tuiHead="'team'" tuiTh>Team</th>
                  <th *tuiHead="'timestamp'" tuiTh>Created</th>
                </tr>
              </thead>
              <tbody tuiTbody [data]="admins()">
                @for (admin of admins(); track admin.id) {
                  <tr tuiTr>
                    <td *tuiCell="'admin'" tuiTd>
                      <div class="admin-cell">
                        <div class="admin-avatar">{{ getInitials(admin.fullName) }}</div>
                        <span class="admin-name">{{ admin.fullName }}</span>
                      </div>
                    </td>
                    <td *tuiCell="'email'" tuiTd>
                      <span class="email">{{ admin.email }}</span>
                    </td>
                    <td *tuiCell="'role'" tuiTd>
                      <span class="role-badge" [style.background]="getRoleBadgeColor(admin.role ? admin.role.name : '')">
                        {{ getRoleDisplayName(admin.role ? admin.role.name : 'Unknown') }}
                      </span>
                    </td>
                    <td *tuiCell="'status'" tuiTd>
                      <span class="status-badge" [class.active]="admin.isActive" [class.inactive]="!admin.isActive">
                        {{ admin.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td *tuiCell="'lastLogin'" tuiTd>
                      <span class="timestamp">{{ formatDate(admin.lastLogin || '') }}</span>
                    </td>
                    <td *tuiCell="'team'" tuiTd>
                      <span class="team-name">{{ admin.team?.name || '-' }}</span>
                    </td>
                    <td *tuiCell="'timestamp'" tuiTd>
                      <span class="timestamp">{{ formatDate(admin.createdAt) }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="pagination">
            <button
              tuiButton
              appearance="secondary"
              size="s"
              [disabled]="currentPage() === 1"
              (click)="previousPage()"
            >
              Previous
            </button>
            <span class="page-info">
              Page {{ currentPage() }} of {{ totalPages() }}
            </span>
            <button
              tuiButton
              appearance="secondary"
              size="s"
              [disabled]="!hasMore()"
              (click)="nextPage()"
            >
              Next
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .audit-logs-tab {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .filters-card {
      padding: 1.5rem;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      align-items: end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-select,
    .filter-input {
      padding: 0.5rem;
      border: 1px solid var(--tui-border-normal);
      border-radius: 0.375rem;
      background: var(--tui-background-base);
      color: var(--tui-text-primary);
      font-size: 0.875rem;
    }

    .logs-card {
      padding: 1.5rem;
      min-height: 400px;
    }

    .loading-state,
    .empty-state,
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 3rem;
      text-align: center;
    }

    .empty-icon,
    .error-icon {
      font-size: 4rem;
      color: var(--tui-text-tertiary);
    }

    .error-icon {
      color: #ef4444;
    }

    .empty-title,
    .error-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.25rem;
      letter-spacing: 1px;
      color: var(--tui-text-primary);
    }

    .empty-subtitle,
    .error-message {
      color: var(--tui-text-secondary);
      font-size: 0.875rem;
    }

    .error-message {
      color: #ef4444;
      max-width: 500px;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .audit-table {
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
      }

      td {
        padding: 0.75rem;
        border-bottom: 1px solid var(--tui-border-normal);
      }

      tr:hover {
        background: var(--tui-background-elevation-1);
      }
    }

    .timestamp {
      font-size: 0.813rem;
      color: var(--tui-text-secondary);
      white-space: nowrap;
    }

    .admin-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .admin-avatar {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background: linear-gradient(135deg, #C53A34, #E45E2C);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    .admin-name {
      font-weight: 500;
      color: var(--tui-text-primary);
    }

    .email {
      font-size: 0.813rem;
      color: var(--tui-text-secondary);
    }

    .role-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      &.active {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
      }

      &.inactive {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }
    }

    .team-name {
      font-size: 0.813rem;
      color: var(--tui-text-primary);
    }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--tui-border-normal);
    }

    .page-info {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 0.938rem;
      letter-spacing: 0.5px;
      color: var(--tui-text-secondary);
    }
  `],
})
export class AuditLogsTabComponent implements OnInit {
  private readonly adminApi = inject(AdminManagementApiService);

  readonly columns = ['timestamp', 'admin', 'email', 'role', 'status', 'lastLogin', 'team'];
  readonly admins = signal<AdminUser[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly hasMore = signal(false);

  roleFilter = '';
  statusFilter = '';

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    this.error.set(null);
    console.log('🔍 Loading admin activity logs...');

    const isActive = this.statusFilter === 'active' ? true : this.statusFilter === 'inactive' ? false : undefined;

    this.adminApi
      .getAdmins(
        this.roleFilter || undefined,
        isActive,
        this.currentPage(),
        50
      )
      .subscribe({
        next: (response) => {
          console.log('✅ Admin activity logs loaded:', response);
          this.admins.set(response.data || []);
          this.hasMore.set(response.meta?.hasMore || false);
          this.totalPages.set(Math.ceil((response.meta?.total || 0) / 50));
          this.error.set(null);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('❌ Error loading admin activity:', error);
          this.admins.set([]);
          const errorMsg = error.status === 401 
            ? 'Unauthorized. Please log in again.' 
            : error.status === 403 
            ? 'You do not have permission to view admin activity.'
            : error.status === 0
            ? 'Unable to connect to the server. Please check your connection.'
            : `Error loading admin activity: ${error.message || 'Unknown error'}`;
          this.error.set(errorMsg);
          this.loading.set(false);
        },
      });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadLogs();
  }

  clearFilters(): void {
    this.roleFilter = '';
    this.statusFilter = '';
    this.onFilterChange();
  }

  nextPage(): void {
    if (this.hasMore()) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadLogs();
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadLogs();
    }
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

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getRoleBadgeColor(roleName: string): string {
    const roleColors: Record<string, string> = {
      'super_admin': '#E45E2C',
      'league_admin': '#3A2634',
      'team_admin': '#C53A34',
      'content_admin': '#10b981',
      'game_admin': '#f59e0b',
    };
    return roleColors[roleName] || '#6b7280';
  }

  getRoleDisplayName(roleName: string): string {
    const roleNames: Record<string, string> = {
      'super_admin': 'Super Admin',
      'league_admin': 'League Admin',
      'team_admin': 'Team Admin',
      'content_admin': 'Content Admin',
      'game_admin': 'Game Admin',
    };
    return roleNames[roleName] || roleName;
  }
}
