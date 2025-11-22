import { Component, input, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TuiLoader, TuiIcon, TuiButton } from '@taiga-ui/core';
import { environment } from '../../../../../../environments/environment';

interface Game {
  id: number;
  date: string;
  time: string;
  homeTeam: { id: number; name: string; };
  awayTeam: { id: number; name: string; };
  homeTeamScore: number | null;
  awayTeamScore: number | null;
  status: string;
  location: string;
}

@Component({
  selector: 'app-season-games-tab',
  standalone: true,
  imports: [CommonModule, TuiLoader, TuiIcon, TuiButton],
  template: `
    <div class="games-tab">
      @if (loading()) {
        <div class="loading-state">
          <tui-loader [size]="'l'"></tui-loader>
          <span>Loading season games...</span>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <tui-icon icon="@tui.circle-alert" />
          <span>{{ error() }}</span>
        </div>
      } @else if (games().length > 0) {
        <div class="games-content">
          <!-- Summary Stats -->
          <div class="summary-bar">
            <div class="summary-item">
              <span class="summary-label">Total Games</span>
              <span class="summary-value">{{ totalGames() }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Completed</span>
              <span class="summary-value">{{ completedGames() }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Upcoming</span>
              <span class="summary-value">{{ upcomingGames() }}</span>
            </div>
          </div>

          <!-- Games Table -->
          <div class="table-container">
            <table class="games-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Matchup</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                @for (game of displayedGames(); track game.id) {
                  <tr>
                    <td>{{ formatDate(game.date) }}</td>
                    <td>{{ game.time || 'TBD' }}</td>
                    <td class="matchup-cell">
                      <span class="matchup">{{ game.awayTeam.name }} &#64; {{ game.homeTeam.name }}</span>
                    </td>
                    <td>
                      @if (game.homeTeamScore !== null && game.awayTeamScore !== null) {
                        <span class="score">{{ game.awayTeamScore }} - {{ game.homeTeamScore }}</span>
                      } @else {
                        <span class="no-score">-</span>
                      }
                    </td>
                    <td>
                      <span class="status-badge" [class]="'status-' + (game.status || '').toLowerCase()">
                        {{ game.status || 'TBD' }}
                      </span>
                    </td>
                    <td>{{ game.location || 'TBD' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (games().length > pageSize()) {
            <div class="pagination">
              <button
                tuiButton
                appearance="secondary"
                size="s"
                [disabled]="currentPage() === 1"
                (click)="prevPage()">
                <tui-icon icon="@tui.chevron-left" />
                Previous
              </button>

              <span class="page-info">Page {{ currentPage() }} of {{ totalPages() }}</span>

              <button
                tuiButton
                appearance="secondary"
                size="s"
                [disabled]="currentPage() === totalPages()"
                (click)="nextPage()">
                Next
                <tui-icon icon="@tui.chevron-right" />
              </button>
            </div>
          }
        </div>
      } @else {
        <div class="empty-state">
          <tui-icon icon="@tui.calendar" />
          <span>No games available for this season</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .games-tab {
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

    .games-content {
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

    .games-table {
      width: 100%;
      border-collapse: collapse;
    }

    .games-table thead {
      background: var(--tui-background-elevation-2);
      border-bottom: 2px solid #C53A34;
    }

    .games-table th {
      padding: 1rem;
      text-align: left;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--tui-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-family: 'Bebas Neue', sans-serif;
    }

    .games-table tbody tr {
      border-bottom: 1px solid var(--tui-border-normal);
      transition: background-color 0.2s;
    }

    .games-table tbody tr:hover {
      background: var(--tui-background-elevation-2);
    }

    .games-table tbody tr:last-child {
      border-bottom: none;
    }

    .games-table td {
      padding: 1rem;
      font-size: 0.9rem;
      color: var(--tui-text-secondary);
    }

    .matchup-cell {
      font-weight: 500;
      color: var(--tui-text-primary);
    }

    .matchup {
      display: block;
    }

    .score {
      font-weight: 700;
      color: var(--tui-text-primary);
      font-size: 1rem;
    }

    .no-score {
      color: var(--tui-text-tertiary);
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      border-radius: 0.375rem;
      font-weight: 600;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-completed {
      background: rgba(34, 197, 94, 0.1);
      color: #16a34a;
    }

    .status-scheduled {
      background: rgba(59, 130, 246, 0.1);
      color: #2563eb;
    }

    .status-in-progress {
      background: rgba(245, 158, 11, 0.1);
      color: #d97706;
    }

    .status-cancelled {
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-top: 1px solid var(--tui-border-normal);
    }

    .page-info {
      font-size: 0.9rem;
      color: var(--tui-text-secondary);
      font-weight: 500;
    }

    @media (max-width: 1024px) {
      .table-container {
        overflow-x: auto;
      }

      .games-table {
        min-width: 800px;
      }
    }

    @media (max-width: 640px) {
      .summary-bar {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    :host-context([tuiTheme='dark']) {
      .summary-bar, .table-container {
        background: rgba(58, 38, 52, 0.3);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .summary-bar:hover {
        background: rgba(58, 38, 52, 0.5);
        box-shadow: 0 4px 6px -1px rgba(197, 58, 52, 0.3);
      }

      .games-table thead {
        background: rgba(58, 38, 52, 0.4);
      }

      .games-table tbody tr:hover {
        background: rgba(58, 38, 52, 0.5);
      }
    }
  `]
})
export class SeasonGamesTabComponent {
  seasonId = input.required<number>();
  private http = inject(HttpClient);

  games = signal<Game[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  currentPage = signal(1);
  pageSize = signal(10);

  totalGames = computed(() => this.games().length);

  completedGames = computed(() => {
    return this.games().filter(g => g.status?.toLowerCase() === 'completed').length;
  });

  upcomingGames = computed(() => {
    return this.games().filter(g => g.status?.toLowerCase() === 'scheduled').length;
  });

  totalPages = computed(() => Math.ceil(this.games().length / this.pageSize()));

  displayedGames = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    const end = start + size;
    return this.games().slice(start, end);
  });

  constructor() {
    effect(() => {
      const id = this.seasonId();
      if (id) {
        this.loadGames(id);
      }
    });
  }

  loadGames(seasonId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<any>(`${environment.apiUrl}/games?limit=1000`).subscribe({
      next: (response) => {
        const allGames = response?.data || [];

        // Filter games for this season and map to our interface
        const seasonGames = allGames
          .filter((game: any) => game.season?.id === seasonId)
          .map((game: any) => ({
            id: game.id,
            date: game.date,
            time: game.time,
            homeTeam: game.homeTeam ? { id: game.homeTeam.id, name: game.homeTeam.name } : { id: 0, name: 'TBD' },
            awayTeam: game.awayTeam ? { id: game.awayTeam.id, name: game.awayTeam.name } : { id: 0, name: 'TBD' },
            homeTeamScore: game.homeTeamScore,
            awayTeamScore: game.awayTeamScore,
            status: game.status || 'Scheduled',
            location: game.location?.name || 'TBD'
          }));

        this.games.set(seasonGames);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading season games:', err);
        this.error.set('Failed to load season games');
        this.loading.set(false);
      }
    });
  }

  formatDate(date: string): string {
    if (!date) return 'TBD';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }
}
