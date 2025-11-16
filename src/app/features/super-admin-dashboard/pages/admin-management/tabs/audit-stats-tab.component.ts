import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiButton, TuiIcon, TuiLoader } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { AdminManagementApiService } from '../../../../../core/services/admin-management-api-service';
import { AdminUser } from '../../../../../core/models/admin-management.model';

@Component({
  selector: 'app-audit-stats-tab',
  standalone: true,
  imports: [CommonModule, TuiButton, TuiIcon, TuiLoader, TuiCardLarge],
  template: `
    <div class="audit-stats-tab">
      @if (loading()) {
        <div class="loading-state">
          <tui-loader size="xl"></tui-loader>
          <p>Loading audit statistics...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <tui-icon icon="@tui.alert-circle" class="error-icon" />
          <p class="error-title">Failed to Load Audit Statistics</p>
          <p class="error-message">{{ error() }}</p>
          <button
            tuiButton
            appearance="primary"
            size="m"
            (click)="loadStats()"
          >
            <tui-icon icon="@tui.rotate-cw" />
            Retry
          </button>
        </div>
      } @else {
        <!-- Summary Cards -->
        <div class="stats-grid">
          <div tuiCardLarge class="stat-card">
            <div class="stat-icon total">
              <tui-icon icon="@tui.users" />
            </div>
            <div class="stat-content">
              <span class="stat-label">Total Admins</span>
              <span class="stat-value">{{ stats().totalAdmins.toLocaleString() }}</span>
            </div>
          </div>

          <div tuiCardLarge class="stat-card">
            <div class="stat-icon create">
              <tui-icon icon="@tui.check-circle" />
            </div>
            <div class="stat-content">
              <span class="stat-label">Active Admins</span>
              <span class="stat-value">{{ stats().activeAdmins.toLocaleString() }}</span>
            </div>
          </div>

          <div tuiCardLarge class="stat-card">
            <div class="stat-icon update">
              <tui-icon icon="@tui.activity" />
            </div>
            <div class="stat-content">
              <span class="stat-label">Recently Active (7d)</span>
              <span class="stat-value">{{ stats().recentlyActive.toLocaleString() }}</span>
            </div>
          </div>

          <div tuiCardLarge class="stat-card">
            <div class="stat-icon delete">
              <tui-icon icon="@tui.x-circle" />
            </div>
            <div class="stat-content">
              <span class="stat-label">Inactive Admins</span>
              <span class="stat-value">{{ stats().inactiveAdmins.toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="charts-row">
          <!-- Status Distribution -->
          <div tuiCardLarge class="chart-card">
            <h3 class="chart-title">ADMIN STATUS DISTRIBUTION</h3>
            <div class="chart-container">
              <div class="pie-chart" [style.background]="'conic-gradient(' + 
                statusChartData()[0].color + ' 0% ' + statusChartData()[0].percentage + '%, ' +
                statusChartData()[1].color + ' ' + statusChartData()[0].percentage + '% 100%)'">
              </div>
              <div class="chart-legend">
                @for (status of statusChartData(); track status.name) {
                  <div class="legend-item">
                    <span class="legend-color" [style.background]="status.color"></span>
                    <span class="legend-label">{{ status.name }}</span>
                    <span class="legend-value">{{ status.value }} ({{ status.percentage.toFixed(1) }}%)</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Role Distribution -->
          <div tuiCardLarge class="chart-card">
            <h3 class="chart-title">ADMIN ROLE DISTRIBUTION</h3>
            <div class="bar-chart">
              @for (role of roleChartData(); track role.name) {
                <div class="bar-item">
                  <div class="bar-label">{{ role.name }}</div>
                  <div class="bar-wrapper">
                    <div
                      class="bar-fill"
                      [style.width.%]="role.percentage"
                      [style.background]="role.color"
                    ></div>
                  </div>
                  <div class="bar-value">{{ role.value }}</div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Most Active Admins -->
        <div tuiCardLarge class="actors-card">
          <h3 class="section-title">MOST RECENTLY ACTIVE ADMINS</h3>
          @if (stats().topAdmins.length === 0) {
            <div class="empty-actors">
              <tui-icon icon="@tui.user-x" class="empty-icon" />
              <p>No admin activity recorded yet</p>
            </div>
          } @else {
            <div class="actors-list">
              @for (admin of stats().topAdmins; track admin.id) {
                <div class="actor-item">
                  <div class="actor-avatar">
                    {{ getInitials(admin.fullName) }}
                  </div>
                  <div class="actor-info">
                    <span class="actor-name">{{ admin.fullName }}</span>
                    <span class="actor-email">{{ admin.email }}</span>
                  </div>
                  <div class="actor-meta">
                    <span class="actor-role" [style.background]="getRoleBadgeColor(admin.role ? admin.role.name : '')">
                      {{ getRoleDisplayName(admin.role ? admin.role.name : 'Unknown') }}
                    </span>
                    <span class="actor-time">{{ formatLastLogin(admin.lastLogin || null) }}</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Last Updated -->
        <div class="last-updated">
          <button tuiButton appearance="secondary" size="s" (click)="loadStats()">
            <tui-icon icon="@tui.rotate-cw" />
            Refresh Stats
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .audit-stats-tab {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .loading-state,
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 3rem;
      text-align: center;
    }

    .error-icon {
      font-size: 4rem;
      color: #ef4444;
    }

    .error-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.25rem;
      letter-spacing: 1px;
      color: var(--tui-text-primary);
    }

    .error-message {
      color: #ef4444;
      font-size: 0.875rem;
      max-width: 500px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
    }

    .stat-icon {
      width: 3rem;
      height: 3rem;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;

      &.total {
        background: rgba(99, 102, 241, 0.1);
        color: #6366f1;
      }

      &.create {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
      }

      &.update {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
      }

      &.delete {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }
    }

    .stat-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-label {
      font-size: 0.813rem;
      color: var(--tui-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 2rem;
      letter-spacing: 1px;
      color: var(--tui-text-primary);
      line-height: 1;
    }

    .charts-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .chart-card {
      padding: 1.5rem;
    }

    .chart-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1rem;
      letter-spacing: 1px;
      color: var(--tui-text-secondary);
      margin: 0 0 1.5rem 0;
    }

    .chart-container {
      display: flex;
      gap: 2rem;
      align-items: center;
    }

    .pie-chart {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: conic-gradient(
        #22c55e 0% 30%,
        #3b82f6 30% 80%,
        #ef4444 80% 100%
      );
      flex-shrink: 0;
    }

    .chart-legend {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .legend-color {
      width: 1rem;
      height: 1rem;
      border-radius: 0.25rem;
      flex-shrink: 0;
    }

    .legend-label {
      flex: 1;
      font-size: 0.875rem;
      color: var(--tui-text-primary);
    }

    .legend-value {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1rem;
      letter-spacing: 0.5px;
      color: var(--tui-text-primary);
    }

    .bar-chart {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .bar-item {
      display: grid;
      grid-template-columns: 100px 1fr 60px;
      gap: 1rem;
      align-items: center;
    }

    .bar-label {
      font-size: 0.875rem;
      color: var(--tui-text-primary);
      text-transform: capitalize;
    }

    .bar-wrapper {
      height: 2rem;
      background: var(--tui-background-elevation-1);
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: 0.5rem;
      transition: width 0.5s ease;
    }

    .bar-value {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1rem;
      letter-spacing: 0.5px;
      color: var(--tui-text-primary);
      text-align: right;
    }

    .actors-card {
      padding: 1.5rem;
    }

    .section-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1rem;
      letter-spacing: 1px;
      color: var(--tui-text-secondary);
      margin: 0 0 1.5rem 0;
    }

    .actors-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .actor-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--tui-background-elevation-1);
      border-radius: 0.5rem;
    }

    .actor-avatar {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      background: linear-gradient(135deg, #C53A34, #E45E2C);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .actor-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .actor-name {
      font-size: 0.875rem;
      color: var(--tui-text-primary);
      font-weight: 600;
    }

    .actor-email {
      font-size: 0.75rem;
      color: var(--tui-text-secondary);
    }

    .actor-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }

    .actor-role {
      font-size: 0.65rem;
      padding: 0.25rem 0.5rem;
      border-radius: 0.75rem;
      color: white;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .actor-time {
      font-size: 0.75rem;
      color: var(--tui-text-tertiary);
    }

    .empty-actors {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 3rem;
      text-align: center;

      .empty-icon {
        font-size: 3rem;
        color: var(--tui-text-tertiary);
      }

      p {
        color: var(--tui-text-secondary);
        margin: 0;
      }
    }

    .last-updated {
      text-align: center;
      font-size: 0.813rem;
      color: var(--tui-text-tertiary);
      padding: 1rem;
    }
  `],
})
export class AuditStatsTabComponent implements OnInit {
  private readonly adminApi = inject(AdminManagementApiService);

  readonly admins = signal<AdminUser[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly stats = computed(() => {
    const allAdmins = this.admins();
    const totalAdmins = allAdmins.length;
    const activeAdmins = allAdmins.filter(a => a.isActive).length;
    const inactiveAdmins = totalAdmins - activeAdmins;

    // Count by role
    const roleCounts: Record<string, number> = {};
    allAdmins.forEach(admin => {
      const roleName = admin.role?.name || 'unknown';
      roleCounts[roleName] = (roleCounts[roleName] || 0) + 1;
    });

    // Get recently active admins (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentlyActive = allAdmins.filter(admin => {
      if (!admin.lastLogin) return false;
      return new Date(admin.lastLogin) > sevenDaysAgo;
    }).length;

    // Top active admins by last login
    const topAdmins = [...allAdmins]
      .filter(a => a.lastLogin)
      .sort((a, b) => new Date(b.lastLogin!).getTime() - new Date(a.lastLogin!).getTime())
      .slice(0, 5);

    return {
      totalAdmins,
      activeAdmins,
      inactiveAdmins,
      recentlyActive,
      roleCounts,
      topAdmins,
    };
  });

  readonly roleChartData = computed(() => {
    const s = this.stats();
    const roles = [
      { name: 'Super Admin', key: 'super_admin', color: '#E45E2C' },
      { name: 'League Admin', key: 'league_admin', color: '#3A2634' },
      { name: 'Team Admin', key: 'team_admin', color: '#C53A34' },
      { name: 'Content Admin', key: 'content_admin', color: '#10b981' },
      { name: 'Game Admin', key: 'game_admin', color: '#f59e0b' },
    ];

    return roles.map(role => ({
      name: role.name,
      value: s.roleCounts[role.key] || 0,
      color: role.color,
      percentage: s.totalAdmins > 0 ? ((s.roleCounts[role.key] || 0) / s.totalAdmins) * 100 : 0,
    }));
  });

  readonly statusChartData = computed(() => {
    const s = this.stats();
    return [
      {
        name: 'Active',
        value: s.activeAdmins,
        percentage: s.totalAdmins > 0 ? (s.activeAdmins / s.totalAdmins) * 100 : 0,
        color: '#22c55e',
      },
      {
        name: 'Inactive',
        value: s.inactiveAdmins,
        percentage: s.totalAdmins > 0 ? (s.inactiveAdmins / s.totalAdmins) * 100 : 0,
        color: '#ef4444',
      },
    ];
  });

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading.set(true);
    this.error.set(null);
    console.log('📊 Loading admin statistics...');

    // Load all admins to compute stats
    this.adminApi.getAdmins(undefined, undefined, 1, 500).subscribe({
      next: (response) => {
        console.log('✅ Admin statistics loaded:', response);
        this.admins.set(response.data || []);
        this.error.set(null);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Error loading admin statistics:', error);
        const errorMsg = error.status === 401 
          ? 'Unauthorized. Please log in again.' 
          : error.status === 403 
          ? 'You do not have permission to view statistics.'
          : error.status === 0
          ? 'Unable to connect to the server. Please check your connection.'
          : `Error loading statistics: ${error.message || 'Unknown error'}`;
        this.error.set(errorMsg);
        this.loading.set(false);
      },
    });
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  truncateId(id: string): string {
    return id.length > 8 ? `${id.substring(0, 8)}...` : id;
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

  formatLastLogin(lastLogin: string | null | undefined): string {
    if (!lastLogin) return 'Never';
    const date = new Date(lastLogin);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
}
