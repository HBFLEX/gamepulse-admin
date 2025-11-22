import { Component, input, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiLoader, TuiIcon } from '@taiga-ui/core';
import { CoachesApiService } from '../../../../../core/services/coaches-api.service';

interface HistoryEntry {
  id: string;
  entity_type: string;
  entity_id: number;
  action: string;
  old_values: any;
  new_values: any;
  created_at: string;
  user_id: string;
  team?: {
    id: number;
    name: string;
    city: string;
  };
  coach_name?: string;
}

@Component({
  selector: 'app-coach-history-tab',
  standalone: true,
  imports: [CommonModule, TuiLoader, TuiIcon],
  template: `
    <div class="history-tab">
      @if (loading()) {
        <div class="loading-state">
          <tui-loader [size]="'m'"></tui-loader>
          <span>Loading team history...</span>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <tui-icon icon="@tui.circle-alert" />
          <span>{{ error() }}</span>
        </div>
      } @else if (history().length > 0) {
        <div class="history-content">
          <div class="history-header">
            <h3>Team Assignment History</h3>
            <p class="history-subtitle">Timeline of team coaching assignments</p>
          </div>

          <div class="timeline">
            @for (entry of history(); track entry.id) {
              <div class="timeline-item">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <span class="timeline-action">{{ getActionText(entry) }}</span>
                    <span class="timeline-date">{{ formatDate(entry.created_at) }}</span>
                  </div>
                  <div class="timeline-body">
                    <p class="timeline-description">{{ getDescription(entry) }}</p>
                    @if (entry.team) {
                      <div class="timeline-details">
                        <div class="detail-row">
                          <span class="detail-label">Team:</span>
                          <span class="detail-value">{{ entry.team.name }}</span>
                        </div>
                        @if (entry.team.city) {
                        <div class="detail-row">
                          <span class="detail-label">City:</span>
                          <span class="detail-value">{{ entry.team.city }}</span>
                        </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="empty-state">
          <tui-icon icon="@tui.calendar" />
          <span>No team history available for this coach</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .history-tab {
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

    .history-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .history-header {
      padding-bottom: 1rem;
      border-bottom: 2px solid #C53A34;
    }

    .history-header h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      font-family: 'Bebas Neue', sans-serif;
      letter-spacing: 1px;
      color: var(--tui-text-primary);
    }

    .history-subtitle {
      margin: 0;
      color: var(--tui-text-secondary);
      font-size: 0.9rem;
    }

    .timeline {
      position: relative;
      padding-left: 2rem;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 0.5rem;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--tui-border-normal);
    }

    .timeline-item {
      position: relative;
      padding-bottom: 2rem;
      display: flex;
      gap: 1rem;
    }

    .timeline-item:last-child {
      padding-bottom: 0;
    }

    .timeline-marker {
      position: absolute;
      left: -1.5rem;
      top: 0.25rem;
      width: 1rem;
      height: 1rem;
      background: #C53A34;
      border-radius: 50%;
      border: 3px solid var(--tui-background-base);
      z-index: 1;
    }

    .timeline-content {
      flex: 1;
      background: var(--tui-background-elevation-1);
      border: 1px solid var(--tui-border-normal);
      border-radius: 0.75rem;
      padding: 1.25rem;
      transition: all 0.2s ease;
    }

    .timeline-content:hover {
      border-color: #C53A34;
      box-shadow: 0 4px 6px -1px rgba(197, 58, 52, 0.1);
    }

    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .timeline-action {
      font-weight: 600;
      color: var(--tui-text-primary);
      font-size: 1rem;
    }

    .timeline-date {
      font-size: 0.85rem;
      color: var(--tui-text-tertiary);
    }

    .timeline-body {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .timeline-description {
      margin: 0;
      color: var(--tui-text-secondary);
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .timeline-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem;
      background: rgba(197, 58, 52, 0.05);
      border-left: 3px solid #C53A34;
      border-radius: 0.25rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }

    .detail-label {
      font-size: 0.85rem;
      color: var(--tui-text-secondary);
      font-weight: 500;
    }

    .detail-value {
      font-size: 0.85rem;
      color: var(--tui-text-primary);
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .timeline {
        padding-left: 1.5rem;
      }

      .timeline-header {
        flex-direction: column;
        align-items: flex-start;
      }
    }

    :host-context([tuiTheme='dark']) {
      .timeline-content {
        background: rgba(58, 38, 52, 0.3);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .timeline-content:hover {
        background: rgba(58, 38, 52, 0.5);
        box-shadow: 0 4px 6px -1px rgba(197, 58, 52, 0.3);
      }

      .timeline::before {
        background: rgba(255, 255, 255, 0.2);
      }

      .timeline-details {
        background: rgba(197, 58, 52, 0.15);
      }
    }
  `]
})
export class CoachHistoryTabComponent {
  coachId = input.required<number>();
  private coachesApi = inject(CoachesApiService);

  history = signal<HistoryEntry[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.coachId();
      if (id) {
        this.loadHistory(id);
      }
    });
  }

  loadHistory(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.coachesApi.getCoachTeamHistory(id).subscribe({
      next: (response) => {
        // Extract team info from new_values in audit logs
        const enrichedHistory = (response.data || []).map((entry: any) => ({
          ...entry,
          team: entry.new_values?.team_name ? {
            id: entry.entity_id,
            name: entry.new_values.team_name,
            city: entry.new_values.team_city || ''
          } : null,
          coach_name: entry.new_values?.coach_name || null
        }));
        
        this.history.set(enrichedHistory);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading coach history:', err);
        this.error.set('Failed to load team history');
        this.loading.set(false);
      }
    });
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getActionText(entry: HistoryEntry): string {
    if (entry.action === 'UPDATE') {
      if (entry.new_values?.team_coach_id === null) {
        return 'Coach Removed from Team';
      }
      return 'Assigned to Team';
    } else if (entry.action === 'CREATE') {
      return 'Team Assignment Created';
    }
    return entry.action || 'Team Activity';
  }

  getDescription(entry: HistoryEntry): string {
    if (entry.team) {
      if (entry.action === 'UPDATE') {
        return `Coach was assigned to ${entry.team.name}`;
      } else if (entry.action === 'CREATE') {
        return `Started coaching ${entry.team.name}`;
      }
    }
    if (entry.action === 'CREATE') {
      return 'Initial team assignment was created';
    }
    return 'Team coaching assignment was modified';
  }
}
