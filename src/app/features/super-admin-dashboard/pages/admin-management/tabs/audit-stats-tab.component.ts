import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiButton, TuiIcon, TuiLoader } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
import { catchError, map, of } from 'rxjs';

interface AuditApiResponse {
   totalActions: number;
   actionBreakdown: {
     UPDATE: number;
     CREATE: number;
     DELETE: number;
   };
   recentLogs: Array<{
     id: number;
     user_id: string;
     action: string;
     entity_type: string;
     entity_id: string | null;
     old_values: any;
     new_values: any;
     ip_address: string | null;
     user_agent: string | null;
     created_at: string;
     user: {
       email: string;
       full_name: string;
     };
   }>;
}

interface AuditStats {
   totalEvents: number;
   lastUpdated: string;
   actionCounts: {
     CREATE: number;
     UPDATE: number;
     DELETE: number;
   };
   topActors: Array<{
     userId: string;
     email: string;
     actionCount: number;
   }>;
   entityTypeDistribution: Record<string, number>;
}

@Component({
  selector: 'app-audit-stats-tab',
  standalone: true,
  imports: [CommonModule, TuiButton, TuiIcon, TuiLoader, TuiCardLarge],
  template: `
    <div class="audit-stats-tab">
      @if (loading()) {
        <div class="loading-state">
          <tui-loader size="m"></tui-loader>
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
              <tui-icon icon="@tui.activity" />
            </div>
            <div class="stat-content">
              <span class="stat-label">Total Events</span>
               <span class="stat-value">{{ (stats()?.totalEvents || 0).toLocaleString() }}</span>
            </div>
          </div>

          <div tuiCardLarge class="stat-card">
            <div class="stat-icon create">
              <tui-icon icon="@tui.check-circle" />
            </div>
            <div class="stat-content">
              <span class="stat-label">Create Actions</span>
               <span class="stat-value">{{ (stats()?.actionCounts?.CREATE || 0).toLocaleString() }}</span>
            </div>
          </div>

          <div tuiCardLarge class="stat-card">
            <div class="stat-icon update">
              <tui-icon icon="@tui.edit-2" />
            </div>
            <div class="stat-content">
              <span class="stat-label">Update Actions</span>
               <span class="stat-value">{{ (stats()?.actionCounts?.UPDATE || 0).toLocaleString() }}</span>
            </div>
          </div>

          <div tuiCardLarge class="stat-card">
            <div class="stat-icon delete">
              <tui-icon icon="@tui.x-circle" />
            </div>
            <div class="stat-content">
              <span class="stat-label">Delete Actions</span>
               <span class="stat-value">{{ (stats()?.actionCounts?.DELETE || 0).toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="charts-row">
          <!-- Action Distribution -->
          <div tuiCardLarge class="chart-card">
            <h3 class="chart-title">ACTION DISTRIBUTION</h3>
            <div class="bar-chart">
              @for (action of actionChartData(); track action.name) {
                <div class="bar-item">
                  <div class="bar-label">{{ action.name }}</div>
                  <div class="bar-wrapper">
                    <div
                      class="bar-fill"
                      [style.width.%]="action.percentage"
                      [style.background]="action.color"
                    ></div>
                  </div>
                  <div class="bar-value">{{ action.value }}</div>
                </div>
              }
            </div>
          </div>

          <!-- Entity Type Distribution -->
          <div tuiCardLarge class="chart-card">
            <h3 class="chart-title">ENTITY TYPE DISTRIBUTION</h3>
            <div class="bar-chart">
              @for (entity of entityChartData(); track entity.name) {
                <div class="bar-item">
                  <div class="bar-label">{{ entity.name }}</div>
                  <div class="bar-wrapper">
                    <div
                      class="bar-fill"
                      [style.width.%]="entity.percentage"
                      [style.background]="entity.color"
                    ></div>
                  </div>
                  <div class="bar-value">{{ entity.value }}</div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Top Actors -->
        <div tuiCardLarge class="actors-card">
          <h3 class="section-title">TOP ACTORS</h3>
           @if ((topActors().length || 0) === 0) {
             <div class="empty-actors">
               <tui-icon icon="@tui.user-x" class="empty-icon" />
               <p>No audit activity recorded yet</p>
             </div>
           } @else {
             <div class="actors-list">
               @for (actor of topActors() || []; track actor.userId) {
                <div class="actor-item">
                  <div class="actor-avatar">
                    {{ getInitials(actor.email) }}
                  </div>
                  <div class="actor-info">
                    <span class="actor-name">{{ actor.email }}</span>
                    <span class="actor-email">{{ actor.userId }}</span>
                  </div>
                  <div class="actor-meta">
                    <span class="actor-count">{{ actor.actionCount }} actions</span>
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
           <span class="update-time">Last updated: {{ stats()?.lastUpdated ? formatTimestamp(stats()!.lastUpdated) : currentTimestamp() }}</span>
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

    .actor-count {
      font-size: 0.875rem;
      color: var(--tui-text-primary);
      font-weight: 600;
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
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.813rem;
      color: var(--tui-text-tertiary);
      padding: 1rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .update-time {
      font-style: italic;
    }

    @media (max-width: 768px) {
      .charts-row {
        grid-template-columns: 1fr;
      }

      .bar-item {
        grid-template-columns: 80px 1fr 50px;
        gap: 0.5rem;
      }

      .bar-label {
        font-size: 0.75rem;
      }

      .bar-value {
        font-size: 0.875rem;
      }

      .last-updated {
        flex-direction: column;
        align-items: stretch;
        text-align: center;
      }
    }
  `],
})
export class AuditStatsTabComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly stats = signal<AuditStats | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly actionChartData = computed(() => {
    const s = this.stats();
    if (!s || !s.actionCounts) return [];

    const actions = [
      { name: 'Create', key: 'CREATE', color: '#22c55e' },
      { name: 'Update', key: 'UPDATE', color: '#3b82f6' },
      { name: 'Delete', key: 'DELETE', color: '#ef4444' },
    ];

    const total = (s.actionCounts.CREATE || 0) + (s.actionCounts.UPDATE || 0) + (s.actionCounts.DELETE || 0);

    return actions.map(action => ({
      name: action.name,
      value: s.actionCounts[action.key as keyof typeof s.actionCounts] || 0,
      color: action.color,
      percentage: total > 0 ? ((s.actionCounts[action.key as keyof typeof s.actionCounts] || 0) / total) * 100 : 0,
    }));
  });

  readonly topActors = computed(() => {
    const s = this.stats();
    return s?.topActors || [];
  });

  readonly entityChartData = computed(() => {
    const s = this.stats();
    if (!s || !s.entityTypeDistribution) return [];

    const entities = Object.keys(s.entityTypeDistribution);
    const total = entities.reduce((sum, key) => sum + (s.entityTypeDistribution[key] || 0), 0);

    const colors = ['#6366f1', '#8b5cf6', '#3b82f6', '#0ea5e9', '#22c55e', '#f59e0b'];

    return entities.map((entity, index) => ({
      name: this.formatEntityType(entity),
      value: s.entityTypeDistribution[entity] || 0,
      color: colors[index % colors.length],
      percentage: total > 0 ? ((s.entityTypeDistribution[entity] || 0) / total) * 100 : 0,
    }));
  });

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading.set(true);
    this.error.set(null);
    console.log('🔍 Loading audit statistics...');

    this.http
      .get<AuditApiResponse | { data: AuditApiResponse }>(`${this.apiUrl}/admin/audit/stats`)
      .pipe(
        map((response) => {
          const apiData = 'data' in response ? response.data : response;
          return this.transformApiResponse(apiData);
        }),
        catchError((error) => {
          console.error('Error loading audit statistics:', error);
          return of(null);
        })
      )
      .subscribe({
        next: (stats) => {
          if (stats) {
            console.log('Audit statistics loaded:', stats);
            this.stats.set(stats);
            this.error.set(null);
          } else {
            this.error.set('Failed to load audit statistics');
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error in subscription:', error);
          const errorMsg = error.status === 401
            ? 'Unauthorized. Please log in again.'
            : error.status === 403
            ? 'You do not have permission to view audit statistics.'
            : error.status === 0
            ? 'Unable to connect to the server. Please check your connection.'
            : `Error loading audit statistics: ${error.message || 'Unknown error'}`;
          this.error.set(errorMsg);
          this.loading.set(false);
        },
      });
  }

  private transformApiResponse(apiData: AuditApiResponse): AuditStats {
    // Compute action counts
    const actionCounts = {
      CREATE: apiData.actionBreakdown.CREATE || 0,
      UPDATE: apiData.actionBreakdown.UPDATE || 0,
      DELETE: apiData.actionBreakdown.DELETE || 0,
    };

    // Compute entity type distribution from recent logs
    const entityTypeDistribution: Record<string, number> = {};
    apiData.recentLogs.forEach(log => {
      const entityType = log.entity_type;
      entityTypeDistribution[entityType] = (entityTypeDistribution[entityType] || 0) + 1;
    });

    // Compute top actors from recent logs
    const userActionCounts: Record<string, { email: string; count: number; userId: string }> = {};
    apiData.recentLogs.forEach(log => {
      const userId = log.user_id;
      const email = log.user.email;
      if (!userActionCounts[userId]) {
        userActionCounts[userId] = { email, count: 0, userId };
      }
      userActionCounts[userId].count++;
    });

    const topActors = Object.values(userActionCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(user => ({
        userId: user.userId,
        email: user.email,
        actionCount: user.count,
      }));

    return {
      totalEvents: apiData.totalActions,
      lastUpdated: new Date().toISOString(),
      actionCounts,
      topActors,
      entityTypeDistribution,
    };
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  currentTimestamp(): string {
    return new Date().toLocaleString();
  }

  getInitials(email: string): string {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  }

  formatEntityType(entityType: string): string {
    return entityType
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
