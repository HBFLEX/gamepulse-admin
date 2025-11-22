import { Component, input, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TuiLoader, TuiIcon } from '@taiga-ui/core';
import { environment } from '../../../../../../environments/environment';

interface PlayerStats {
  season_id: number;
  season_name: string;
  games_played: number;
  points_total: number;
  points_avg: number;
  rebounds_total: number;
  rebounds_avg: number;
  assists_total: number;
  assists_avg: number;
  steals_total: number;
  steals_avg: number;
  blocks_total: number;
  blocks_avg: number;
  field_goal_pct: number;
  three_point_pct: number;
  free_throw_pct: number;
}

@Component({
  selector: 'app-player-stats-tab',
  standalone: true,
  imports: [CommonModule, TuiLoader, TuiIcon],
  template: `
    <div class="stats-tab">
      @if (loading()) {
        <div class="loading-state">
          <tui-loader [size]="'l'"></tui-loader>
          <span>Loading player statistics...</span>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <tui-icon icon="@tui.circle-alert" />
          <span>{{ error() }}</span>
        </div>
      } @else if (stats()) {
        <div class="stats-content">
          <!-- Stats Overview Cards -->
          <div class="stats-overview">
            <div class="stat-card highlight">
              <div class="stat-icon">
                <tui-icon icon="@tui.star" />
              </div>
              <div class="stat-info">
                <span class="stat-label">Points Per Game</span>
                <span class="stat-value">{{ stats()!.points_avg ? stats()!.points_avg.toFixed(1) : '0.0' }}</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <tui-icon icon="@tui.trending-up" />
              </div>
              <div class="stat-info">
                <span class="stat-label">Rebounds Per Game</span>
                <span class="stat-value">{{ stats()!.rebounds_avg ? stats()!.rebounds_avg.toFixed(1) : '0.0' }}</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <tui-icon icon="@tui.arrow-right" />
              </div>
              <div class="stat-info">
                <span class="stat-label">Assists Per Game</span>
                <span class="stat-value">{{ stats()!.assists_avg ? stats()!.assists_avg.toFixed(1) : '0.0' }}</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <tui-icon icon="@tui.activity" />
              </div>
              <div class="stat-info">
                <span class="stat-label">Games Played</span>
                <span class="stat-value">{{ stats()!.games_played || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- Detailed Stats Tables -->
          <div class="stats-tables">
            <!-- Scoring Stats -->
            <div class="stats-section">
              <h3>Scoring Statistics</h3>
              <div class="stats-table">
                <div class="table-row header">
                  <span>Category</span>
                  <span>Total</span>
                  <span>Average</span>
                </div>
                <div class="table-row">
                  <span class="category">Points</span>
                  <span>{{ stats()!.points_total || 0 }}</span>
                  <span>{{ stats()!.points_avg ? stats()!.points_avg.toFixed(1) : '0.0' }}</span>
                </div>
                <div class="table-row">
                  <span class="category">Field Goal %</span>
                  <span>-</span>
                  <span>{{ formatPercentage(stats()!.field_goal_pct) }}</span>
                </div>
                <div class="table-row">
                  <span class="category">3-Point %</span>
                  <span>-</span>
                  <span>{{ formatPercentage(stats()!.three_point_pct) }}</span>
                </div>
                <div class="table-row">
                  <span class="category">Free Throw %</span>
                  <span>-</span>
                  <span>{{ formatPercentage(stats()!.free_throw_pct) }}</span>
                </div>
              </div>
            </div>

            <!-- Performance Stats -->
            <div class="stats-section">
              <h3>Performance Statistics</h3>
              <div class="stats-table">
                <div class="table-row header">
                  <span>Category</span>
                  <span>Total</span>
                  <span>Average</span>
                </div>
                <div class="table-row">
                  <span class="category">Rebounds</span>
                  <span>{{ stats()!.rebounds_total || 0 }}</span>
                  <span>{{ stats()!.rebounds_avg ? stats()!.rebounds_avg.toFixed(1) : '0.0' }}</span>
                </div>
                <div class="table-row">
                  <span class="category">Assists</span>
                  <span>{{ stats()!.assists_total || 0 }}</span>
                  <span>{{ stats()!.assists_avg ? stats()!.assists_avg.toFixed(1) : '0.0' }}</span>
                </div>
                <div class="table-row">
                  <span class="category">Steals</span>
                  <span>{{ stats()!.steals_total || 0 }}</span>
                  <span>{{ stats()!.steals_avg ? stats()!.steals_avg.toFixed(1) : '0.0' }}</span>
                </div>
                <div class="table-row">
                  <span class="category">Blocks</span>
                  <span>{{ stats()!.blocks_total || 0 }}</span>
                  <span>{{ stats()!.blocks_avg ? stats()!.blocks_avg.toFixed(1) : '0.0' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="empty-state">
          <tui-icon icon="@tui.bar-chart" />
          <span>No statistics available for this player</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .stats-tab {
      padding: 1.5rem;
    }

    .loading-state, .error-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;
      color: #64748b;
    }

    .error-state {
      color: #ef4444;
    }

    .stats-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .stats-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      transition: all 0.2s;
    }

    .stat-card:hover {
      border-color: #C53A34;
      box-shadow: 0 4px 6px -1px rgba(197, 58, 52, 0.1);
    }

    .stat-card.highlight {
      background: linear-gradient(135deg, #C53A34 0%, #A32F2A 100%);
      color: white;
      border: none;
    }

    .stat-icon {
      width: 3rem;
      height: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      background: rgba(197, 58, 52, 0.1);
      border-radius: 0.5rem;
    }

    .stat-card.highlight .stat-icon {
      background: rgba(255, 255, 255, 0.2);
    }

    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-label {
      font-size: 0.875rem;
      opacity: 0.8;
      font-weight: 500;
    }

    .stat-value {
      font-size: 1.75rem;
      font-family: 'Bebas Neue', sans-serif;
      letter-spacing: 1px;
      font-weight: 600;
    }

    .stats-tables {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .stats-section {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      padding: 1.5rem;
    }

    .stats-section h3 {
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
      font-family: 'Bebas Neue', sans-serif;
      letter-spacing: 1px;
      color: #1a1a1a;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #C53A34;
    }

    .stats-table {
      display: flex;
      flex-direction: column;
    }

    .table-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 1rem;
      padding: 0.875rem 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .table-row:last-child {
      border-bottom: none;
    }

    .table-row.header {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding-bottom: 0.5rem;
    }

    .table-row span {
      display: flex;
      align-items: center;
    }

    .category {
      font-weight: 500;
      color: #1a1a1a;
    }

    .table-row span:not(.category) {
      font-weight: 600;
      color: #334155;
      justify-content: flex-end;
    }

    @media (max-width: 1024px) {
      .stats-tables {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .stats-overview {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PlayerStatsTabComponent {
  playerId = input.required<number>();
  private http = inject(HttpClient);

  stats = signal<PlayerStats | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.playerId();
      if (id) {
        this.loadPlayerStats(id);
      }
    });
  }

  loadPlayerStats(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<PlayerStats>(`${environment.apiUrl}/players/${id}/stats`).subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading player stats:', err);
        this.error.set('Failed to load player statistics');
        this.loading.set(false);
      }
    });
  }

  formatPercentage(value: number | null | undefined): string {
    if (value == null) return '0.0%';
    return `${(value * 100).toFixed(1)}%`;
  }
}
