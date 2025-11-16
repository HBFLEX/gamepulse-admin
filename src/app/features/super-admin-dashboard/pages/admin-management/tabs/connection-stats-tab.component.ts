import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiButton, TuiIcon, TuiLoader } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { WebSocketService } from '../../../../../core/services/websocket.service';
import { Subject, takeUntil } from 'rxjs';

interface ConnectionStats {
  activeUsers: number;
  activeSession: number;
  scorekeeperUsers: number;
  totalConnections: number;
  byRole: {
    super_admin: number;
    league_admin: number;
    team_admin: number;
    content_admin: number;
    game_admin: number;
    user: number;
  };
  updatedAt: string;
}

@Component({
  selector: 'app-connection-stats-tab',
  standalone: true,
  imports: [CommonModule, TuiButton, TuiIcon, TuiLoader, TuiCardLarge],
  template: `
    <div class="connection-stats-tab">
      <div class="header-row">
        <div class="title-section">
          <h2 class="section-title">REAL-TIME CONNECTION STATS</h2>
          <div class="connection-indicator" [class.connected]="isConnected()" [class.disconnected]="!isConnected()">
            <span class="indicator-dot"></span>
            <span class="indicator-text">{{ isConnected() ? 'Connected' : 'Disconnected' }}</span>
          </div>
        </div>
        <button
          tuiButton
          appearance="secondary"
          size="s"
          (click)="refreshStats()"
          [disabled]="loading()"
        >
          <tui-icon icon="@tui.rotate-cw" />
          {{ isConnected() ? 'Refresh' : 'Connect' }}
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <tui-loader size="m"></tui-loader>
          <p>Loading connection stats...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <tui-icon icon="@tui.alert-circle" class="error-icon" />
          <p class="error-title">Connection Error</p>
          <p class="error-message">{{ error() }}</p>
          <p class="error-subtitle">Waiting for real-time data from WebSocket server...</p>
          <button
            tuiButton
            appearance="primary"
            size="m"
            (click)="refreshStats()"
          >
            <tui-icon icon="@tui.rotate-cw" />
            Reconnect
          </button>
        </div>
      } @else if (!isConnected()) {
        <div class="disconnected-state">
          <tui-icon icon="@tui.wifi-off" class="disconnected-icon" />
          <p class="disconnected-title">WebSocket Disconnected</p>
          <p class="disconnected-subtitle">Waiting for connection to receive live data...</p>
          <button
            tuiButton
            appearance="primary"
            size="m"
            (click)="refreshStats()"
          >
            <tui-icon icon="@tui.wifi" />
            Connect
          </button>
        </div>
      } @else {
        <!-- Summary Cards -->
        <div class="stats-grid">
          <div tuiCardLarge class="stat-card highlight">
            <div class="stat-icon">
              <tui-icon icon="@tui.users" />
            </div>
            <div class="stat-content">
              <span class="stat-label">Active Users</span>
              <span class="stat-value">{{ stats()!.activeUsers.toLocaleString() }}</span>
            </div>
            <div class="stat-indicator active"></div>
          </div>

          <div tuiCardLarge class="stat-card">
            <div class="stat-icon">
              <tui-icon icon="@tui.activity" />
            </div>
            <div class="stat-content">
              <span class="stat-label">Active Sessions</span>
              <span class="stat-value">{{ stats()!.activeSession.toLocaleString() }}</span>
            </div>
          </div>

          <div tuiCardLarge class="stat-card">
            <div class="stat-icon">
              <tui-icon icon="@tui.edit-2" />
            </div>
            <div class="stat-content">
              <span class="stat-label">Scorekeeper Users</span>
              <span class="stat-value">{{ stats()!.scorekeeperUsers.toLocaleString() }}</span>
            </div>
          </div>

          <div tuiCardLarge class="stat-card">
            <div class="stat-icon">
              <tui-icon icon="@tui.globe" />
            </div>
            <div class="stat-content">
              <span class="stat-label">Total Connections</span>
              <span class="stat-value">{{ stats()!.totalConnections.toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <!-- Connections by Role -->
        <div tuiCardLarge class="role-card">
          <h3 class="card-title">CONNECTIONS BY ROLE</h3>
          <div class="role-grid">
            @for (role of roleData(); track role.name) {
              <div class="role-item">
                <div class="role-header">
                  <div class="role-icon" [style.background]="role.color">
                    <tui-icon [icon]="role.icon" />
                  </div>
                  <span class="role-name">{{ role.displayName }}</span>
                </div>
                <div class="role-stats">
                  <span class="role-count">{{ role.count }}</span>
                  <span class="role-percentage">{{ role.percentage }}%</span>
                </div>
                <div class="role-bar">
                  <div
                    class="role-bar-fill"
                    [style.width.%]="role.percentage"
                    [style.background]="role.color"
                  ></div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Visual Chart -->
        <div tuiCardLarge class="chart-card">
          <h3 class="card-title">ROLE DISTRIBUTION</h3>
          <div class="donut-container">
            <svg viewBox="0 0 200 200" class="donut-chart">
              @for (segment of chartSegments(); track segment.role) {
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  [attr.stroke]="segment.color"
                  stroke-width="30"
                  [attr.stroke-dasharray]="segment.dashArray"
                  [attr.stroke-dashoffset]="segment.dashOffset"
                  class="donut-segment"
                />
              }
              <text x="100" y="95" text-anchor="middle" class="donut-total-label">TOTAL</text>
              <text x="100" y="115" text-anchor="middle" class="donut-total-value">
                {{ stats()!.totalConnections }}
              </text>
            </svg>
            <div class="donut-legend">
              @for (role of roleData(); track role.name) {
                <div class="legend-item">
                  <span class="legend-dot" [style.background]="role.color"></span>
                  <span class="legend-label">{{ role.displayName }}</span>
                  <span class="legend-value">{{ role.count }}</span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Last Updated -->
        <div class="last-updated">
          <tui-icon icon="@tui.clock" />
          Last updated: {{ formatTimestamp(stats().updatedAt) }}
          <span class="auto-refresh">(Updates in real-time via WebSocket)</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .connection-stats-tab {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .title-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .section-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.5rem;
      letter-spacing: 1px;
      color: var(--tui-text-primary);
      margin: 0;
    }

    .connection-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.813rem;

      &.connected {
        color: #22c55e;
      }

      &.disconnected {
        color: #ef4444;
      }
    }

    .indicator-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;

      .connected & {
        background: #22c55e;
        animation: pulse 2s infinite;
      }

      .disconnected & {
        background: #ef4444;
      }
    }

    .indicator-text {
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .loading-state,
    .error-state,
    .disconnected-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 3rem;
      text-align: center;
    }

    .error-icon,
    .disconnected-icon {
      font-size: 4rem;
      color: #ef4444;
    }

    .disconnected-icon {
      color: #f59e0b;
    }

    .error-title,
    .disconnected-title {
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

    .error-subtitle,
    .disconnected-subtitle {
      color: var(--tui-text-secondary);
      font-size: 0.875rem;
      max-width: 500px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .stat-card {
      position: relative;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      overflow: hidden;

      &.highlight {
        border: 2px solid #C53A34;
      }
    }

    .stat-icon {
      width: 3rem;
      height: 3rem;
      border-radius: 0.75rem;
      background: linear-gradient(135deg, #C53A34, #E45E2C);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: white;
      flex-shrink: 0;
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

    .stat-indicator {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 50%;

      &.active {
        background: #22c55e;
        animation: pulse 2s infinite;
      }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .role-card,
    .chart-card {
      padding: 1.5rem;
    }

    .card-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1rem;
      letter-spacing: 1px;
      color: var(--tui-text-secondary);
      margin: 0 0 1.5rem 0;
    }

    .role-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .role-item {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .role-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .role-icon {
      width: 2rem;
      height: 2rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1rem;
    }

    .role-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--tui-text-primary);
    }

    .role-stats {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .role-count {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.5rem;
      letter-spacing: 0.5px;
      color: var(--tui-text-primary);
    }

    .role-percentage {
      font-size: 0.875rem;
      color: var(--tui-text-secondary);
    }

    .role-bar {
      height: 0.5rem;
      background: var(--tui-background-elevation-1);
      border-radius: 0.25rem;
      overflow: hidden;
    }

    .role-bar-fill {
      height: 100%;
      transition: width 0.5s ease;
    }

    .donut-container {
      display: grid;
      grid-template-columns: 250px 1fr;
      gap: 2rem;
      align-items: center;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        justify-items: center;
      }
    }

    .donut-chart {
      width: 250px;
      height: 250px;
      transform: rotate(-90deg);
    }

    .donut-segment {
      transition: stroke-dasharray 0.5s ease;
    }

    .donut-total-label {
      font-size: 0.75rem;
      fill: var(--tui-text-secondary);
      transform: rotate(90deg);
      transform-origin: center;
      letter-spacing: 1px;
    }

    .donut-total-value {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.5rem;
      fill: var(--tui-text-primary);
      transform: rotate(90deg);
      transform-origin: center;
      letter-spacing: 1px;
    }

    .donut-legend {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .legend-dot {
      width: 1rem;
      height: 1rem;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .legend-label {
      flex: 1;
      font-size: 0.875rem;
      color: var(--tui-text-primary);
    }

    .legend-value {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.125rem;
      letter-spacing: 0.5px;
      color: var(--tui-text-primary);
    }

    .last-updated {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 0.813rem;
      color: var(--tui-text-tertiary);
      padding: 1rem;
    }

    .auto-refresh {
      margin-left: 0.5rem;
      font-style: italic;
    }
  `],
})
export class ConnectionStatsTabComponent implements OnInit, OnDestroy {
  private readonly websocket = inject(WebSocketService);
  private readonly destroy$ = new Subject<void>();

  readonly stats = signal<ConnectionStats>({
    activeUsers: 0,
    activeSession: 0,
    scorekeeperUsers: 0,
    totalConnections: 0,
    byRole: {
      super_admin: 0,
      league_admin: 0,
      team_admin: 0,
      content_admin: 0,
      game_admin: 0,
      user: 0,
    },
    updatedAt: new Date().toISOString(),
  });
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly isConnected = this.websocket.connected;

  readonly roleData = computed(() => {
    const s = this.stats();
    if (!s) return [];

    const roles = [
      { name: 'super_admin', displayName: 'Super Admin', icon: '@tui.shield', color: '#6366f1' },
      { name: 'league_admin', displayName: 'League Admin', icon: '@tui.award', color: '#8b5cf6' },
      { name: 'team_admin', displayName: 'Team Admin', icon: '@tui.users', color: '#3b82f6' },
      { name: 'content_admin', displayName: 'Content Admin', icon: '@tui.edit-2', color: '#0ea5e9' },
      { name: 'game_admin', displayName: 'Game Admin', icon: '@tui.activity', color: '#22c55e' },
      { name: 'user', displayName: 'Regular User', icon: '@tui.user', color: '#94a3b8' },
    ];

    return roles.map(role => ({
      ...role,
      count: s.byRole[role.name as keyof typeof s.byRole] || 0,
      percentage: ((s.byRole[role.name as keyof typeof s.byRole] || 0) / s.totalConnections) * 100,
    }));
  });

  readonly chartSegments = computed(() => {
    const data = this.roleData();
    const circumference = 2 * Math.PI * 70; // radius = 70
    let currentOffset = 0;

    return data.map(role => {
      const segmentLength = (role.percentage / 100) * circumference;
      const segment = {
        role: role.name,
        color: role.color,
        dashArray: `${segmentLength} ${circumference}`,
        dashOffset: -currentOffset,
      };
      currentOffset += segmentLength;
      return segment;
    });
  });

  ngOnInit(): void {
    console.log('🔌 Connection Stats Tab initialized');
    this.setupWebSocketListeners();

    // Connect to WebSocket if not already connected
    if (!this.websocket.connected()) {
      console.log('📡 Connecting to WebSocket...');
      this.websocket.connect();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupWebSocketListeners(): void {
    // Listen for connection stats updates from WebSocket
    this.websocket.connectionStats$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          console.log('📊 Received connection stats from WebSocket:', stats);
          this.stats.set({
            activeUsers: stats.usersOnline || 0,
            activeSession: stats.activeSessions || 0,
            scorekeeperUsers: stats.activeScorekeeperUsers || 0,
            totalConnections: stats.totalConnections || 0,
            byRole: {
              super_admin: 0,
              league_admin: 0,
              team_admin: 0,
              content_admin: 0,
              game_admin: 0,
              user: stats.usersOnline || 0,
            },
            updatedAt: new Date().toISOString(),
          });
          this.error.set(null);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('❌ Error receiving connection stats:', error);
          this.error.set('Failed to receive real-time connection data');
        },
      });
  }

  refreshStats(): void {
    console.log('🔄 Refreshing connection stats...');
    // WebSocket will automatically update via the subscription
    if (!this.websocket.connected()) {
      this.loading.set(true);
      this.websocket.connect();
    }
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }
}
