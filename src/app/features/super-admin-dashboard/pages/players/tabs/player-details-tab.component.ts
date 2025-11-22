import { Component, input, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiLoader, TuiIcon } from '@taiga-ui/core';
import { PlayersApiService, Player } from '../../../../../core/services/players-api.service';

@Component({
  selector: 'app-player-details-tab',
  standalone: true,
  imports: [CommonModule, TuiLoader, TuiIcon],
  template: `
    <div class="details-tab">
      @if (loading()) {
        <div class="loading-state">
          <tui-loader [size]="'m'"></tui-loader>
          <span>Loading player details...</span>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <tui-icon icon="@tui.circle-alert" />
          <span>{{ error() }}</span>
        </div>
      } @else if (player()) {
        <div class="details-content">
          <div class="profile-section">
            <div class="player-avatar">
              <tui-icon icon="@tui.user" />
            </div>
            <div class="player-info">
              <h2>{{ player()!.fullName }}</h2>
              <div class="player-meta">
                <span class="jersey-number">#{{ player()!.number }}</span>
                <span class="divider">•</span>
                <span>{{ player()!.position || 'N/A' }}</span>
                @if (player()!.team) {
                  <span class="divider">•</span>
                  <span>{{ player()!.team?.name }}</span>
                }
              </div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-card">
              <h3>Personal Information</h3>
              <div class="info-rows">
                <div class="info-row">
                  <span class="label">Full Name</span>
                  <span class="value">{{ player()!.fullName }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Age</span>
                  <span class="value">{{ calculateAge(player()!.birthDate) }} years</span>
                </div>
                <div class="info-row">
                  <span class="label">Birth Date</span>
                  <span class="value">{{ formatDate(player()!.birthDate) }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Nationality</span>
                  <span class="value">{{ player()!.nationality }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Birthplace</span>
                  <span class="value">{{ player()!.city }}</span>
                </div>
              </div>
            </div>

            <div class="info-card">
              <h3>Physical Attributes</h3>
              <div class="info-rows">
                <div class="info-row">
                  <span class="label">Height</span>
                  <span class="value">{{ player()!.height }} cm ({{ convertToFeet(player()!.height) }})</span>
                </div>
                <div class="info-row">
                  <span class="label">Weight</span>
                  <span class="value">{{ player()!.weight }} kg ({{ convertToPounds(player()!.weight) }} lbs)</span>
                </div>
              </div>
            </div>

            <div class="info-card">
              <h3>Team Information</h3>
              <div class="info-rows">
                @if (player()!.team) {
                  <div class="info-row">
                    <span class="label">Team</span>
                    <span class="value">{{ player()!.team?.name }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">City</span>
                    <span class="value">{{ player()!.team?.city }}</span>
                  </div>
                } @else {
                  <div class="info-row">
                    <span class="label">Team</span>
                    <span class="value text-muted">Free Agent</span>
                  </div>
                }
                <div class="info-row">
                  <span class="label">Jersey Number</span>
                  <span class="value">#{{ player()!.number }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Position</span>
                  <span class="value">{{ player()!.position || 'N/A' }}</span>
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

    .player-avatar {
      width: 5rem;
      height: 5rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
    }

    .player-info h2 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-family: 'Bebas Neue', sans-serif;
      letter-spacing: 1px;
    }

    .player-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      opacity: 0.9;
    }

    .jersey-number {
      font-weight: 600;
      font-size: 1.1rem;
    }

    .divider {
      opacity: 0.6;
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

    .text-muted {
      color: var(--tui-text-tertiary) !important;
    }

    @media (max-width: 768px) {
      .info-grid {
        grid-template-columns: 1fr;
      }

      .profile-section {
        flex-direction: column;
        text-align: center;
      }
    }

    :host-context([tuiTheme='dark']) {
      .info-card {
        background: rgba(58, 38, 52, 0.3);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .info-card:hover {
        background: rgba(58, 38, 52, 0.5);
        box-shadow: 0 4px 6px -1px rgba(197, 58, 52, 0.3);
      }
    }
  `]
})
export class PlayerDetailsTabComponent {
  playerId = input.required<number>();
  private playersApi = inject(PlayersApiService);

  player = signal<Player | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.playerId();
      if (id) {
        this.loadPlayerDetails(id);
      }
    });
  }

  loadPlayerDetails(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.playersApi.getPlayerDetails(id).subscribe({
      next: (response: any) => {
        // Server returns { player: {...}, team: {...}, currentSeasonStats: {...}, careerStats: {...} }
        // Merge player and team data
        const playerData = {
          ...response.player,
          team: response.team
        };
        this.player.set(playerData);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading player details:', err);
        this.error.set('Failed to load player details');
        this.loading.set(false);
      }
    });
  }

  calculateAge(birthDate: string): number {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  convertToFeet(cm: number): string {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  }

  convertToPounds(kg: number): number {
    return Math.round(kg * 2.20462);
  }
}
