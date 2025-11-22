import { Component, input, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TuiLoader, TuiIcon } from '@taiga-ui/core';
import { environment } from '../../../../../../environments/environment';

interface SeasonDetails {
  id: number;
  season_year: string;
  season_type: string;
  created_at: string;
  totalGames?: number;
  completedGames?: number;
  upcomingGames?: number;
  teams?: number;
}

@Component({
  selector: 'app-season-details-tab',
  standalone: true,
  imports: [CommonModule, TuiLoader, TuiIcon],
  template: `
    <div class="details-tab">
      @if (loading()) {
        <div class="loading-state">
          <tui-loader [size]="'l'"></tui-loader>
          <span>Loading season details...</span>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <tui-icon icon="@tui.circle-alert" />
          <span>{{ error() }}</span>
        </div>
      } @else if (season()) {
        <div class="details-content">
          <div class="profile-section">
            <div class="season-icon">
              <tui-icon icon="@tui.calendar" />
            </div>
            <div class="season-info">
              <h2>{{ season()!.season_year }}</h2>
              <div class="season-meta">
                <span class="type-badge" [class]="'type-' + (season()!.season_type || '').toLowerCase().replace(' ', '-')">
                  {{ season()!.season_type }}
                </span>
              </div>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">
                <tui-icon icon="@tui.calendar" />
              </div>
              <div class="stat-info">
                <span class="stat-label">Total Games</span>
                <span class="stat-value">{{ season()!.totalGames || 0 }}</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">
                <tui-icon icon="@tui.check-circle" />
              </div>
              <div class="stat-info">
                <span class="stat-label">Completed</span>
                <span class="stat-value">{{ season()!.completedGames || 0 }}</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">
                <tui-icon icon="@tui.clock" />
              </div>
              <div class="stat-info">
                <span class="stat-label">Upcoming</span>
                <span class="stat-value">{{ season()!.upcomingGames || 0 }}</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">
                <tui-icon icon="@tui.users" />
              </div>
              <div class="stat-info">
                <span class="stat-label">Teams</span>
                <span class="stat-value">{{ season()!.teams || 0 }}</span>
              </div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-card">
              <h3>Season Information</h3>
              <div class="info-rows">
                <div class="info-row">
                  <span class="label">Season Year</span>
                  <span class="value">{{ season()!.season_year }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Season Type</span>
                  <span class="value">{{ season()!.season_type }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Created On</span>
                  <span class="value">{{ formatDate(season()!.created_at) }}</span>
                </div>
              </div>
            </div>

            <div class="info-card">
              <h3>Game Statistics</h3>
              <div class="info-rows">
                <div class="info-row">
                  <span class="label">Total Games</span>
                  <span class="value">{{ season()!.totalGames || 0 }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Completed</span>
                  <span class="value">{{ season()!.completedGames || 0 }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Upcoming</span>
                  <span class="value">{{ season()!.upcomingGames || 0 }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Completion Rate</span>
                  <span class="value">{{ calculateCompletionRate() }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .details-tab {
      padding: 1.5rem;
      background: transparent;
    }

    .loading-state, .error-state {
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

    .details-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .profile-section {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 2rem;
      background: linear-gradient(135deg, #C53A34 0%, #A32F2A 100%);
      border-radius: 0.75rem;
      color: white;
    }

    .season-icon {
      width: 5rem;
      height: 5rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
    }

    .season-info h2 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-family: 'Bebas Neue', sans-serif;
      letter-spacing: 1px;
    }

    .season-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .type-badge {
      padding: 0.375rem 0.75rem;
      border-radius: 0.375rem;
      font-size: 0.85rem;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.2);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: var(--tui-background-elevation-1);
      border: 1px solid var(--tui-border-normal);
      border-radius: 0.75rem;
      transition: all 0.2s ease;
    }

    .stat-card:hover {
      border-color: #C53A34;
      box-shadow: 0 4px 6px -1px rgba(197, 58, 52, 0.1);
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
      color: #C53A34;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-label {
      font-size: 0.8rem;
      color: var(--tui-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .stat-value {
      font-size: 1.75rem;
      font-family: 'Bebas Neue', sans-serif;
      letter-spacing: 1px;
      color: var(--tui-text-primary);
      font-weight: 600;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .info-card {
      background: var(--tui-background-elevation-1);
      border: 1px solid var(--tui-border-normal);
      border-radius: 0.75rem;
      padding: 1.5rem;
      transition: all 0.2s ease;
    }

    .info-card:hover {
      border-color: #C53A34;
      box-shadow: 0 4px 6px -1px rgba(197, 58, 52, 0.1);
    }

    .info-card h3 {
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
      font-family: 'Bebas Neue', sans-serif;
      letter-spacing: 1px;
      color: var(--tui-text-primary);
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #C53A34;
    }

    .info-rows {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.625rem 0;
    }

    .info-row .label {
      font-size: 0.875rem;
      color: var(--tui-text-secondary);
      font-weight: 500;
    }

    .info-row .value {
      font-size: 0.95rem;
      color: var(--tui-text-primary);
      font-weight: 600;
      text-align: right;
    }

    @media (max-width: 768px) {
      .info-grid, .stats-grid {
        grid-template-columns: 1fr;
      }

      .profile-section {
        flex-direction: column;
        text-align: center;
      }
    }

    :host-context([tuiTheme='dark']) {
      .stat-card, .info-card {
        background: rgba(58, 38, 52, 0.3);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .stat-card:hover, .info-card:hover {
        background: rgba(58, 38, 52, 0.5);
        box-shadow: 0 4px 6px -1px rgba(197, 58, 52, 0.3);
      }
    }
  `]
})
export class SeasonDetailsTabComponent {
  seasonId = input.required<number>();
  private http = inject(HttpClient);

  season = signal<SeasonDetails | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.seasonId();
      if (id) {
        this.loadSeasonDetails(id);
      }
    });
  }

  loadSeasonDetails(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    // Fetch games for this season to calculate statistics
    this.http.get<any>(`${environment.apiUrl}/games?limit=1000`).subscribe({
      next: (response) => {
        const allGames = response?.data || [];
        
        // Filter games for this season
        const seasonGames = allGames.filter((game: any) => game.season?.id === id);
        
        if (seasonGames.length > 0) {
          const firstGame = seasonGames[0];
          const completedGames = seasonGames.filter((g: any) => g.status?.toLowerCase() === 'completed').length;
          const upcomingGames = seasonGames.filter((g: any) => g.status?.toLowerCase() === 'scheduled').length;
          
          // Get unique teams
          const teamSet = new Set<number>();
          seasonGames.forEach((game: any) => {
            if (game.homeTeam?.id) teamSet.add(game.homeTeam.id);
            if (game.awayTeam?.id) teamSet.add(game.awayTeam.id);
          });

          this.season.set({
            id: id,
            season_year: firstGame.season.season_year,
            season_type: firstGame.season.season_type || 'Regular Season',
            created_at: firstGame.season.created_at,
            totalGames: seasonGames.length,
            completedGames,
            upcomingGames,
            teams: teamSet.size
          });
        } else {
          this.error.set('No data found for this season');
        }
        
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading season details:', err);
        this.error.set('Failed to load season details');
        this.loading.set(false);
      }
    });
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  calculateCompletionRate(): string {
    const season = this.season();
    if (!season || !season.totalGames || season.totalGames === 0) return '0';
    const rate = (season.completedGames || 0) / season.totalGames * 100;
    return rate.toFixed(1);
  }
}
