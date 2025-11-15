import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApiService } from '../../../../core/services/admin-api.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { Subject, takeUntil, interval } from 'rxjs';
import { TuiLoader } from '@taiga-ui/core';
import { StatsCardsComponent } from '../../components/overview/stats-cards/stats-cards.component';
import { SystemHealthComponent } from '../../components/overview/system-health/system-health.component';
import { RealtimeActivityComponent } from '../../components/overview/realtime-activity/realtime-activity.component';
import { EngagementChartComponent } from '../../components/overview/engagement-chart/engagement-chart.component';
import { ContentPerformanceComponent } from '../../components/overview/content-performance/content-performance.component';
import { AdminActionsTableComponent } from '../../components/overview/admin-actions-table/admin-actions-table.component';
import { TeamDistributionChartComponent } from '../../components/overview/team-distribution-chart/team-distribution-chart.component';
import { ContentTypesChartComponent } from '../../components/overview/content-types-chart/content-types-chart.component';
import {
  DashboardStats,
  SystemHealth,
  RealtimeActivity,
  UserEngagement,
  ContentPerformance,
  AdminAction,
  Alert,
  PendingApproval,
} from '../../../../core/models/admin.models';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule,
    TuiLoader,
    StatsCardsComponent,
    SystemHealthComponent,
    RealtimeActivityComponent,
    EngagementChartComponent,
    ContentPerformanceComponent,
    AdminActionsTableComponent,
    TeamDistributionChartComponent,
    ContentTypesChartComponent,
  ],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.less',
})
export class OverviewComponent implements OnInit, OnDestroy {
  private readonly adminApi = inject(AdminApiService);
  private readonly websocket = inject(WebSocketService);
  private readonly destroy$ = new Subject<void>();

  readonly loading = signal(true);
  readonly stats = signal<DashboardStats | null>(null);
  readonly systemHealth = signal<SystemHealth | null>(null);
  readonly realtimeActivity = signal<RealtimeActivity | null>(null);
  readonly userEngagement = signal<UserEngagement[]>([]);
  readonly contentPerformance = signal<ContentPerformance[]>([]);
  readonly adminActions = signal<AdminAction[]>([]);

  // Expose WebSocket connection state directly from the service
  readonly isWebSocketConnected = this.websocket.connected;

  // Real data signals (will be populated from API)
  readonly teamDistribution = signal<any[]>([]);
  readonly contentTypes = signal<any[]>([]);

  ngOnInit(): void {
    // Setup WebSocket FIRST so it's ready to receive updates
    this.setupWebSocket();
    // Then load dashboard data
    this.loadDashboardData();
    // Finally setup auto-refresh
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.websocket.disconnect();
  }

  private loadDashboardData(): void {
    this.loading.set(true);

    // Load all dashboard data in parallel
    this.adminApi
      .getDashboardStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        console.log('📊 Initial stats loaded from API:', data);
        this.stats.set(data);
      });

    this.adminApi
      .getSystemHealth()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => this.systemHealth.set(data));

    this.adminApi
      .getRealtimeActivity()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        const current = this.realtimeActivity();
        if (!current) {
          this.realtimeActivity.set(data);
        } else {
          this.realtimeActivity.set({
            ...data,
            liveGames: current.liveGames,
          });
        }
      });

    this.adminApi
      .getUserEngagement(30)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => this.userEngagement.set(data));

    this.adminApi
      .getContentPerformance(10)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => this.contentPerformance.set(data));

    this.adminApi
      .getAdminActions(10)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => this.adminActions.set(data));

    // Load team distribution data
    this.loadTeamDistribution();

    // Load content types data
    this.loadContentTypes();

    this.loading.set(false);
  }

  private setupWebSocket(): void {
    // Get JWT token from auth service storage key
    const token = localStorage.getItem('gp_access_token');

    // Connect to Socket.IO with authentication token
    if (token) {
      this.websocket.connect(token);

      // Log connection state after connection is established
      setTimeout(() => {
        console.log('✅ WebSocket connected:', this.websocket.connected());
        console.log('📡 Setting up event listeners...');
      }, 1000);
    } else {
      console.warn('No authentication token found for WebSocket connection');
    }

    // Listen to real-time connection stats updates
    this.websocket.connectionStats$.pipe(takeUntil(this.destroy$)).subscribe((stats) => {
      console.log('📊 Real-time connection stats update:', stats);
      
      const currentActivity = this.realtimeActivity();
      if (currentActivity) {
        this.realtimeActivity.set({
          liveGames: currentActivity.liveGames, // Preserve live games count
          usersOnline: stats.usersOnline,
          activeSessions: stats.activeSessions,
          activeScorekeeperUsers: stats.activeScorekeeperUsers,
        });
      }
    });

    // Listen to live games updates - THIS IS THE SOURCE OF TRUTH
    this.websocket.liveGames$.pipe(takeUntil(this.destroy$)).subscribe((games) => {
      console.log('🔴 Live games from WebSocket:', games.length);

      // Update ONLY the live games count, preserve other activity data
      const currentActivity = this.realtimeActivity();
      if (currentActivity) {
        this.realtimeActivity.set({
          ...currentActivity,
          liveGames: games.length, // Use WebSocket count as source of truth
        });
      }
    });

    // Listen to individual game updates
    this.websocket.gameUpdate$.pipe(takeUntil(this.destroy$)).subscribe((game) => {
      console.log('Game updated:', game);
    });

    // Listen to game start events - increment ONLY live games
    this.websocket.gameStart$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      console.log('🎮 Game started event received:', data);

      // Increment live games count
      const currentActivity = this.realtimeActivity();
      if (currentActivity) {
        this.realtimeActivity.set({
          ...currentActivity,
          liveGames: currentActivity.liveGames + 1,
        });
        console.log('✅ Live games incremented to:', currentActivity.liveGames + 1);
      }
    });

    // Listen to game end events - decrement ONLY live games
    this.websocket.gameEnd$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      console.log('🏁 Game ended event received:', data);

      // Decrement live games count
      const currentActivity = this.realtimeActivity();
      if (currentActivity) {
        this.realtimeActivity.set({
          ...currentActivity,
          liveGames: Math.max(0, currentActivity.liveGames - 1),
        });
        console.log('✅ Live games decremented to:', Math.max(0, currentActivity.liveGames - 1));
      }
    });
  }

  private setupAutoRefresh(): void {
    // Refresh analytics and user metrics every 30 seconds
    // BUT preserve the live games count from WebSocket
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.adminApi.getRealtimeActivity().subscribe((data) => {
          // Keep WebSocket live games count, update other metrics
          const currentActivity = this.realtimeActivity();
          this.realtimeActivity.set({
            ...data,
            liveGames: currentActivity?.liveGames ?? data.liveGames, // Preserve WebSocket count
          });
        });
      });

    // Refresh admin actions every minute
    interval(60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.adminApi.getAdminActions(10).subscribe((data) => this.adminActions.set(data));
      });

    // Refresh stats every 2 minutes
    interval(120000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.adminApi.getDashboardStats().subscribe((data) => this.stats.set(data));
      });
  }

  private loadTeamDistribution(): void {
    this.adminApi.getTeamsWithStatus().subscribe((data) => {
      this.teamDistribution.set([
        { name: 'Active Teams', value: data.active, color: '#10b981' },
        { name: 'Inactive Teams', value: data.inactive, color: '#ef4444' },
      ]);
    });
  }

  private loadContentTypes(): void {
    this.adminApi.getContentCounts().subscribe((data) => {
      this.contentTypes.set([
        { type: 'News', count: data.news, color: '#E45E2C', icon: '@tui.book-open' },
        { type: 'Stories', count: data.stories, color: '#3A2634', icon: '@tui.file-text' },
        { type: 'Moments', count: data.moments, color: '#C53A34', icon: '@tui.camera' },
      ]);
    });
  }
}
