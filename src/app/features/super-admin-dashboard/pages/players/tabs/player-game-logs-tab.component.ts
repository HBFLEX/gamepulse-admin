import { Component, input, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TuiLoader, TuiIcon, TuiButton } from '@taiga-ui/core';
import { environment } from '../../../../../../environments/environment';

interface GameLog {
  gameId: number;
  date: string;
  time?: string;
  opponent: string;
  opponentCity?: string;
  isHome: boolean;
  isAway: boolean;
  result: string;
  homeTeamScore: number;
  awayTeamScore: number;
  minutesPlayed: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers?: number;
  fouls?: number;
  fieldGoalsMade?: number;
  fieldGoalsAttempted?: number;
  threePointersMade?: number;
  threePointersAttempted?: number;
  freeThrowsMade?: number;
  freeThrowsAttempted?: number;
}

interface GameLogResponse {
  data: GameLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

@Component({
  selector: 'app-player-game-logs-tab',
  standalone: true,
  imports: [CommonModule, TuiLoader, TuiIcon, TuiButton],
  template: `
    <div class="game-logs-tab">
      @if (loading() && gameLogs().length === 0) {
        <div class="loading-state">
          <tui-loader [size]="'m'"></tui-loader>
          <span>Loading game logs...</span>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <tui-icon icon="@tui.circle-alert" />
          <span>{{ error() }}</span>
        </div>
      } @else if (gameLogs().length > 0) {
        <div class="game-logs-content">
          <!-- Summary Stats -->
          <div class="summary-bar">
            <div class="summary-item">
              <span class="summary-label">Total Games</span>
              <span class="summary-value">{{ totalGames() }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Avg Points</span>
              <span class="summary-value">{{ avgPoints() }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Avg Rebounds</span>
              <span class="summary-value">{{ avgRebounds() }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Avg Assists</span>
              <span class="summary-value">{{ avgAssists() }}</span>
            </div>
          </div>

          <!-- Game Logs Table -->
          <div class="table-container">
            <table class="game-logs-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Matchup</th>
                  <th>Result</th>
                  <th>MIN</th>
                  <th>PTS</th>
                  <th>REB</th>
                  <th>AST</th>
                  <th>STL</th>
                  <th>BLK</th>
                </tr>
              </thead>
              <tbody>
                @for (log of gameLogs(); track log.gameId) {
                  <tr>
                    <td>{{ formatDate(log.date) }}</td>
                    <td class="matchup-cell">
                      <span class="matchup">
                        @if (log.isHome) {
                          {{ log.opponent }} @ Home
                        } @else {
                          @ {{ log.opponent }}
                        }
                      </span>
                    </td>
                    <td>
                      <span class="score" [class.win]="log.result === 'Win'" [class.loss]="log.result === 'Loss'">
                        {{ log.result }} ({{ log.awayTeamScore }} - {{ log.homeTeamScore }})
                      </span>
                    </td>
                    <td>{{ log.minutesPlayed }}</td>
                    <td class="stat-highlight">{{ log.points }}</td>
                    <td>{{ log.rebounds }}</td>
                    <td>{{ log.assists }}</td>
                    <td>{{ log.steals }}</td>
                    <td>{{ log.blocks }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (hasMore()) {
            <div class="pagination">
              <button
                tuiButton
                appearance="secondary"
                size="m"
                [disabled]="loading()"
                (click)="loadMore()">
                @if (loading()) {
                  <tui-loader [size]="'xs'" />
                  Loading...
                } @else {
                  Load More Games
                }
              </button>
            </div>
          }
        </div>
      } @else {
        <div class="empty-state">
          <tui-icon icon="@tui.calendar" />
          <span>No game logs available for this player</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .game-logs-tab {
      padding: 1.5rem;
      background: transparent;
    }

    .loading-state, .error-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;
      color: var(--tui-text-secondary);
    }

    .error-state {
      color: #ef4444;
    }

    .game-logs-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .summary-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      padding: 1.25rem;
      background: var(--tui-background-elevation-1);
      border: 1px solid var(--tui-border-normal);
      border-radius: 0.75rem;
      transition: all 0.2s ease;
    }

    .summary-bar:hover {
      border-color: #C53A34;
      box-shadow: 0 4px 6px -1px rgba(197, 58, 52, 0.1);
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    .summary-label {
      font-size: 0.8rem;
      color: var(--tui-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .summary-value {
      font-size: 1.5rem;
      font-family: 'Bebas Neue', sans-serif;
      letter-spacing: 1px;
      color: #C53A34;
      font-weight: 600;
    }

    .table-container {
      background: var(--tui-background-elevation-1);
      border: 1px solid var(--tui-border-normal);
      border-radius: 0.75rem;
      overflow: hidden;
    }

    .game-logs-table {
      width: 100%;
      border-collapse: collapse;
    }

    .game-logs-table thead {
      background: var(--tui-background-elevation-2);
      border-bottom: 2px solid #C53A34;
    }

    .game-logs-table th {
      padding: 1rem;
      text-align: left;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--tui-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-family: 'Bebas Neue', sans-serif;
    }

    .game-logs-table th:nth-child(n+4) {
      text-align: center;
    }

    .game-logs-table tbody tr {
      border-bottom: 1px solid var(--tui-border-normal);
      transition: background-color 0.2s;
    }

    .game-logs-table tbody tr:hover {
      background: var(--tui-background-elevation-2);
    }

    .game-logs-table tbody tr:last-child {
      border-bottom: none;
    }

    .game-logs-table td {
      padding: 1rem;
      font-size: 0.9rem;
      color: var(--tui-text-secondary);
    }

    .game-logs-table td:nth-child(n+4) {
      text-align: center;
      font-weight: 600;
    }

    .matchup-cell {
      font-weight: 500;
      color: var(--tui-text-primary);
    }

    .matchup {
      display: block;
    }

    .score {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      border-radius: 0.375rem;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .score.win {
      background: rgba(34, 197, 94, 0.1);
      color: #16a34a;
    }

    .score.loss {
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
    }

    .stat-highlight {
      color: #C53A34 !important;
      font-weight: 700 !important;
    }

    .pagination {
      display: flex;
      justify-content: center;
      padding: 1rem;
    }

    @media (max-width: 1024px) {
      .table-container {
        overflow-x: auto;
      }

      .game-logs-table {
        min-width: 800px;
      }
    }

    @media (max-width: 640px) {
      .summary-bar {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    :host-context([tuiTheme='dark']) {
      .summary-bar {
        background: rgba(58, 38, 52, 0.3);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .summary-bar:hover {
        background: rgba(58, 38, 52, 0.5);
        box-shadow: 0 4px 6px -1px rgba(197, 58, 52, 0.3);
      }

      .table-container {
        background: rgba(58, 38, 52, 0.3);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .game-logs-table thead {
        background: rgba(58, 38, 52, 0.4);
      }

      .game-logs-table tbody tr:hover {
        background: rgba(58, 38, 52, 0.5);
      }

      .score.win {
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
      }

      .score.loss {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }
    }
  `]
})
export class PlayerGameLogsTabComponent {
  playerId = input.required<number>();
  private http = inject(HttpClient);

  gameLogs = signal<GameLog[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  currentPage = signal(1);
  hasMore = signal(false);

  totalGames = computed(() => this.gameLogs().length);

  avgPoints = computed(() => {
    const logs = this.gameLogs();
    if (logs.length === 0) return '0.0';
    const total = logs.reduce((sum, log) => sum + log.points, 0);
    return (total / logs.length).toFixed(1);
  });

  avgRebounds = computed(() => {
    const logs = this.gameLogs();
    if (logs.length === 0) return '0.0';
    const total = logs.reduce((sum, log) => sum + log.rebounds, 0);
    return (total / logs.length).toFixed(1);
  });

  avgAssists = computed(() => {
    const logs = this.gameLogs();
    if (logs.length === 0) return '0.0';
    const total = logs.reduce((sum, log) => sum + log.assists, 0);
    return (total / logs.length).toFixed(1);
  });

  constructor() {
    effect(() => {
      const id = this.playerId();
      if (id) {
        this.loadGameLogs(id);
      }
    });
  }

  loadGameLogs(id: number, page: number = 1): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<GameLogResponse>(`${environment.apiUrl}/players/${id}/game-log?page=${page}&limit=10`).subscribe({
      next: (response) => {
        if (page === 1) {
          this.gameLogs.set(response.data || []);
        } else {
          this.gameLogs.set([...this.gameLogs(), ...(response.data || [])]);
        }
        this.hasMore.set(response.meta?.hasMore || false);
        this.currentPage.set(page);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading game logs:', err);
        this.error.set('Failed to load game logs');
        this.loading.set(false);
      }
    });
  }

  loadMore(): void {
    const id = this.playerId();
    if (id) {
      this.loadGameLogs(id, this.currentPage() + 1);
    }
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
