import { Component, input, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiLoader, TuiIcon } from '@taiga-ui/core';
import { CoachesApiService, CoachDetails } from '../../../../../core/services/coaches-api.service';

@Component({
  selector: 'app-coach-details-tab',
  standalone: true,
  imports: [CommonModule, TuiLoader, TuiIcon],
  template: `
    <div class="details-tab">
      @if (loading()) {
        <div class="loading-state">
          <tui-loader [size]="'m'"></tui-loader>
          <span>Loading coach details...</span>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <tui-icon icon="@tui.circle-alert" />
          <span>{{ error() }}</span>
        </div>
      } @else if (coach()) {
        <div class="details-content">
          <div class="profile-section">
            <div class="coach-avatar">
              <tui-icon icon="@tui.user" />
            </div>
            <div class="coach-info">
              <h2>{{ coach()!.full_name }}</h2>
              <div class="coach-meta">
                @if (coach()!.coach_experience_years) {
                  <span class="experience">{{ coach()!.coach_experience_years }} years experience</span>
                }
                @if (coach()!.coach_nationality) {
                  <span class="divider">•</span>
                  <span>{{ coach()!.coach_nationality }}</span>
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
                  <span class="value">{{ coach()!.full_name }}</span>
                </div>
                @if (coach()!.age) {
                <div class="info-row">
                  <span class="label">Age</span>
                  <span class="value">{{ coach()!.age }} years</span>
                </div>
                }
                @if (coach()!.coach_birth_date) {
                <div class="info-row">
                  <span class="label">Birth Date</span>
                  <span class="value">{{ formatDate(coach()!.coach_birth_date) }}</span>
                </div>
                }
                <div class="info-row">
                  <span class="label">Nationality</span>
                  <span class="value">{{ coach()!.coach_nationality || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <div class="info-card">
              <h3>Coaching Experience</h3>
              <div class="info-rows">
                <div class="info-row">
                  <span class="label">Years of Experience</span>
                  <span class="value">{{ coach()!.coach_experience_years || 0 }} years</span>
                </div>
                <div class="info-row">
                  <span class="label">Coaching Since</span>
                  <span class="value">{{ calculateCoachingSince() }}</span>
                </div>
              </div>
            </div>

            <div class="info-card">
              <h3>Current Team</h3>
              <div class="info-rows">
                @if (coach()!.current_team) {
                  <div class="info-row">
                    <span class="label">Team</span>
                    <span class="value">{{ coach()!.current_team?.name }}</span>
                  </div>
                } @else {
                  <div class="info-row">
                    <span class="label">Status</span>
                    <span class="value text-muted">Available</span>
                  </div>
                }
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

    .coach-avatar {
      width: 5rem;
      height: 5rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
    }

    .coach-info h2 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-family: 'Bebas Neue', sans-serif;
      letter-spacing: 1px;
    }

    .coach-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      opacity: 0.9;
    }

    .experience {
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
export class CoachDetailsTabComponent {
  coachId = input.required<number>();
  private coachesApi = inject(CoachesApiService);

  coach = signal<CoachDetails | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.coachId();
      if (id) {
        this.loadCoachDetails(id);
      }
    });
  }

  loadCoachDetails(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.coachesApi.getCoachDetails(id).subscribe({
      next: (coach) => {
        this.coach.set(coach);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading coach details:', err);
        this.error.set('Failed to load coach details');
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

  calculateCoachingSince(): string {
    const coach = this.coach();
    if (!coach?.coach_experience_years) return 'N/A';
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - coach.coach_experience_years;
    return startYear.toString();
  }
}
