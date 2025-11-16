import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiIcon, TuiLabel, TuiLoader } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { TuiTable } from '@taiga-ui/addon-table';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
import { catchError, map, of } from 'rxjs';

interface AuditLog {
  id: number;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: number | null;
  old_values: any;
  new_values: any;
  created_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
  };
}

interface AuditLogResponse {
  data: AuditLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

@Component({
  selector: 'app-audit-logs-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TuiButton,
    TuiIcon,
    TuiLabel,
    TuiLoader,
    TuiCardLarge,
    TuiTable,
  ],
  template: `
    <div class="audit-logs-tab">
      <!-- Filters -->
      <div tuiCardLarge class="filters-card">
        <div class="filters-grid">
          <div class="filter-group">
            <label tuiLabel>Action</label>
            <select
              class="filter-select"
              [(ngModel)]="actionFilter"
              (ngModelChange)="onFilterChange()"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
            </select>
          </div>

          <div class="filter-group">
            <label tuiLabel>Entity Type</label>
            <select
              class="filter-select"
              [(ngModel)]="entityTypeFilter"
              (ngModelChange)="onFilterChange()"
            >
              <option value="">All Types</option>
              <option value="admin_user">Admin User</option>
              <option value="game">Game</option>
              <option value="team">Team</option>
              <option value="player">Player</option>
              <option value="content">Content</option>
              <option value="news">News</option>
            </select>
          </div>

          <div class="filter-actions">
            <button
              tuiButton
              appearance="secondary"
              size="s"
              (click)="clearFilters()"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Admin Activity Table -->
      <div tuiCardLarge class="logs-card">
        @if (loading()) {
          <div class="loading-state">
            <tui-loader size="xl"></tui-loader>
            <p>Loading admin activity...</p>
          </div>
        } @else if (error()) {
          <div class="error-state">
            <tui-icon icon="@tui.alert-circle" class="error-icon" />
            <p class="error-title">Failed to Load Audit Logs</p>
            <p class="error-message">{{ error() }}</p>
            <button
              tuiButton
              appearance="primary"
              size="m"
              (click)="loadLogs()"
            >
              <tui-icon icon="@tui.rotate-cw" />
              Retry
            </button>
          </div>
        } @else if (logs().length === 0) {
          <div class="empty-state">
            <tui-icon icon="@tui.file-text" class="empty-icon" />
            <p class="empty-title">No Audit Logs Found</p>
            <p class="empty-subtitle">Try adjusting your filters</p>
          </div>
        } @else {
          <div class="table-wrapper">
            <table tuiTable [columns]="columns" class="audit-table">
              <thead>
                <tr tuiThGroup>
                  <th *tuiHead="'timestamp'" tuiTh>Timestamp</th>
                  <th *tuiHead="'user'" tuiTh>User</th>
                  <th *tuiHead="'action'" tuiTh>Action</th>
                  <th *tuiHead="'entity'" tuiTh>Entity</th>
                  <th *tuiHead="'entityId'" tuiTh>Entity ID</th>
                  <th *tuiHead="'changes'" tuiTh>Changes</th>
                </tr>
              </thead>
              <tbody tuiTbody [data]="logs()">
                @for (log of logs(); track log.id) {
                  <tr tuiTr>
                    <td *tuiCell="'timestamp'" tuiTd>
                      <span class="timestamp">{{ formatTimestamp(log.created_at) }}</span>
                    </td>
                    <td *tuiCell="'user'" tuiTd>
                      <div class="user-cell">
                        <div class="user-avatar">{{ getUserInitial(log.user?.full_name || log.user?.email || 'U') }}</div>
                        <div class="user-info">
                          <span class="user-name">{{ log.user?.full_name || 'Unknown User' }}</span>
                          <span class="user-email">{{ log.user?.email || '-' }}</span>
                        </div>
                      </div>
                    </td>
                    <td *tuiCell="'action'" tuiTd>
                      <span class="action-badge" [class]="'action-' + log.action.toLowerCase()">
                        {{ log.action }}
                      </span>
                    </td>
                    <td *tuiCell="'entity'" tuiTd>
                      <span class="entity-type">{{ formatEntityType(log.entity_type) }}</span>
                    </td>
                    <td *tuiCell="'entityId'" tuiTd>
                      <span class="entity-id">{{ log.entity_id || '-' }}</span>
                    </td>
                    <td *tuiCell="'changes'" tuiTd>
                      <button
                        tuiButton
                        appearance="flat"
                        size="xs"
                        (click)="viewChanges(log)"
                      >
                        <tui-icon icon="@tui.eye" />
                        View
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="pagination">
            <button
              tuiButton
              appearance="secondary"
              size="s"
              [disabled]="currentPage() === 1"
              (click)="previousPage()"
            >
              Previous
            </button>
            <span class="page-info">
              Page {{ currentPage() }} of {{ totalPages() }}
            </span>
            <button
              tuiButton
              appearance="secondary"
              size="s"
              [disabled]="!hasMore()"
              (click)="nextPage()"
            >
              Next
            </button>
          </div>
        }
      </div>

      <!-- Changes Modal -->
      @if (showChangesModal() && selectedLog()) {
        <div class="modal-overlay" (click)="closeChangesModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-title-section">
                <tui-icon icon="@tui.file-text" class="modal-icon" />
                <div>
                  <h3 class="modal-title">Audit Log Details</h3>
                  <p class="modal-subtitle">
                    {{ formatEntityType(selectedLog()!.entity_type) }} 
                    @if (selectedLog()!.entity_id) {
                      <span class="entity-id-inline">#{{ selectedLog()!.entity_id }}</span>
                    }
                  </p>
                </div>
              </div>
              <button
                tuiIconButton
                appearance="icon"
                size="s"
                (click)="closeChangesModal()"
                class="modal-close"
              >
                <tui-icon icon="@tui.x" />
              </button>
            </div>

            <div class="modal-body">
              <!-- Action Info -->
              <div class="info-section">
                <div class="info-row">
                  <span class="info-label">Action:</span>
                  <span class="action-badge" [class]="'action-' + selectedLog()!.action.toLowerCase()">
                    {{ selectedLog()!.action }}
                  </span>
                </div>
                <div class="info-row">
                  <span class="info-label">Performed by:</span>
                  <div class="user-info-inline">
                    <div class="user-avatar-small">{{ getUserInitial(selectedLog()!.user?.full_name || selectedLog()!.user?.email || 'U') }}</div>
                    <div>
                      <span class="user-name-inline">{{ selectedLog()!.user?.full_name || 'Unknown User' }}</span>
                      <span class="user-email-inline">{{ selectedLog()!.user?.email || '-' }}</span>
                    </div>
                  </div>
                </div>
                <div class="info-row">
                  <span class="info-label">Timestamp:</span>
                  <span class="info-value">{{ formatTimestamp(selectedLog()!.created_at) }}</span>
                </div>
              </div>

              <!-- Changes Table -->
              @if (hasChanges()) {
                <div class="changes-section">
                  <h4 class="section-title">Changes Made</h4>
                  <div class="changes-table">
                    <div class="changes-header">
                      <div class="change-field">Field</div>
                      <div class="change-old">Old Value</div>
                      <div class="change-new">New Value</div>
                    </div>
                    @for (change of getChangedFields(); track change.field) {
                      <div class="changes-row">
                        <div class="change-field">
                          <span class="field-name">{{ change.field }}</span>
                        </div>
                        <div class="change-old">
                          <div class="change-value old">{{ formatValue(change.oldValue) }}</div>
                        </div>
                        <div class="change-new">
                          <div class="change-value new">{{ formatValue(change.newValue) }}</div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              } @else {
                <div class="no-changes">
                  <tui-icon icon="@tui.info" />
                  <p>No detailed change information available</p>
                </div>
              }
            </div>

            <div class="modal-footer">
              <button
                tuiButton
                appearance="secondary"
                size="m"
                (click)="closeChangesModal()"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .audit-logs-tab {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .filters-card {
      padding: 1.5rem;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      align-items: end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-select,
    .filter-input {
      padding: 0.5rem;
      border: 1px solid var(--tui-border-normal);
      border-radius: 0.375rem;
      background: var(--tui-background-base);
      color: var(--tui-text-primary);
      font-size: 0.875rem;
    }

    .logs-card {
      padding: 1.5rem;
      min-height: 400px;
    }

    .loading-state,
    .empty-state,
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 3rem;
      text-align: center;
    }

    .empty-icon,
    .error-icon {
      font-size: 4rem;
      color: var(--tui-text-tertiary);
    }

    .error-icon {
      color: #ef4444;
    }

    .empty-title,
    .error-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.25rem;
      letter-spacing: 1px;
      color: var(--tui-text-primary);
    }

    .empty-subtitle,
    .error-message {
      color: var(--tui-text-secondary);
      font-size: 0.875rem;
    }

    .error-message {
      color: #ef4444;
      max-width: 500px;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .audit-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;

      th {
        text-align: left;
        font-family: 'Bebas Neue', sans-serif;
        font-size: 0.875rem;
        letter-spacing: 1px;
        color: var(--tui-text-secondary);
        padding: 0.75rem;
        border-bottom: 2px solid var(--tui-border-normal);
      }

      td {
        padding: 0.75rem;
        border-bottom: 1px solid var(--tui-border-normal);
      }

      tr:hover {
        background: var(--tui-background-elevation-1);
      }
    }

    .timestamp {
      font-size: 0.813rem;
      color: var(--tui-text-secondary);
      white-space: nowrap;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background: linear-gradient(135deg, #C53A34, #E45E2C);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .user-name {
      font-weight: 500;
      color: var(--tui-text-primary);
      font-size: 0.875rem;
    }

    .user-email {
      font-size: 0.75rem;
      color: var(--tui-text-secondary);
    }

    .action-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      &.action-create {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
      }

      &.action-update {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
      }

      &.action-delete {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }
    }

    .entity-type {
      font-size: 0.875rem;
      color: var(--tui-text-primary);
      font-weight: 500;
    }

    .entity-id {
      font-size: 0.813rem;
      color: var(--tui-text-secondary);
      font-family: 'Courier New', monospace;
    }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--tui-border-normal);
    }

    .page-info {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 0.938rem;
      letter-spacing: 0.5px;
      color: var(--tui-text-secondary);
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-content {
      background: var(--tui-background-base);
      border-radius: 1rem;
      max-width: 800px;
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.5rem;
      border-bottom: 1px solid var(--tui-border-normal);
    }

    .modal-title-section {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .modal-icon {
      font-size: 1.5rem;
      color: #C53A34;
      flex-shrink: 0;
    }

    .modal-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.5rem;
      letter-spacing: 1px;
      color: var(--tui-text-primary);
      margin: 0 0 0.25rem 0;
    }

    .modal-subtitle {
      font-size: 0.875rem;
      color: var(--tui-text-secondary);
      margin: 0;
    }

    .entity-id-inline {
      font-family: 'Courier New', monospace;
      background: rgba(197, 58, 52, 0.1);
      color: #C53A34;
      padding: 0.125rem 0.5rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }

    .info-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .info-label {
      font-weight: 600;
      color: var(--tui-text-secondary);
      font-size: 0.875rem;
      min-width: 120px;
    }

    .info-value {
      color: var(--tui-text-primary);
      font-size: 0.875rem;
    }

    .user-info-inline {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar-small {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background: linear-gradient(135deg, #C53A34, #E45E2C);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    .user-name-inline {
      display: block;
      font-weight: 500;
      color: var(--tui-text-primary);
      font-size: 0.875rem;
    }

    .user-email-inline {
      display: block;
      font-size: 0.75rem;
      color: var(--tui-text-secondary);
    }

    .changes-section {
      margin-top: 1.5rem;
    }

    .section-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.125rem;
      letter-spacing: 0.5px;
      color: var(--tui-text-primary);
      margin: 0 0 1rem 0;
    }

    .changes-table {
      border: 1px solid var(--tui-border-normal);
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .changes-header {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      background: var(--tui-background-neutral-1);
      padding: 0.75rem 1rem;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--tui-text-secondary);
      gap: 1rem;
    }

    .changes-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      padding: 1rem;
      border-top: 1px solid var(--tui-border-normal);
      gap: 1rem;
      align-items: start;
    }

    .change-field .field-name {
      font-weight: 600;
      color: var(--tui-text-primary);
      font-size: 0.875rem;
    }

    .change-value {
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      font-size: 0.813rem;
      font-family: 'Courier New', monospace;
      word-break: break-word;
      white-space: pre-wrap;
    }

    .change-value.old {
      background: rgba(239, 68, 68, 0.05);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.1);
    }

    .change-value.new {
      background: rgba(34, 197, 94, 0.05);
      color: #22c55e;
      border: 1px solid rgba(34, 197, 94, 0.1);
    }

    .no-changes {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 3rem;
      text-align: center;
      color: var(--tui-text-secondary);
    }

    .no-changes tui-icon {
      font-size: 3rem;
      color: var(--tui-text-tertiary);
    }

    .no-changes p {
      margin: 0;
      font-size: 0.875rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid var(--tui-border-normal);
    }

    @media (max-width: 768px) {
      .modal-content {
        max-height: 95vh;
      }

      .changes-header,
      .changes-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }

      .changes-row {
        padding: 0.75rem;
      }

      .change-field,
      .change-old,
      .change-new {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .change-field::before {
        content: 'Field:';
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--tui-text-secondary);
        text-transform: uppercase;
      }

      .change-old::before {
        content: 'Old Value:';
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--tui-text-secondary);
        text-transform: uppercase;
      }

      .change-new::before {
        content: 'New Value:';
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--tui-text-secondary);
        text-transform: uppercase;
      }

      .changes-header {
        display: none;
      }

      .info-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .info-label {
        min-width: auto;
      }
    }
  `],
})
export class AuditLogsTabComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly columns = ['timestamp', 'user', 'action', 'entity', 'entityId', 'changes'];
  readonly logs = signal<AuditLog[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly totalLogs = signal(0);
  readonly hasMore = signal(false);
  readonly showChangesModal = signal(false);
  readonly selectedLog = signal<AuditLog | null>(null);

  actionFilter = '';
  entityTypeFilter = '';

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    this.error.set(null);
    console.log('🔍 Loading audit logs...');

    let params = new HttpParams()
      .set('page', this.currentPage().toString())
      .set('limit', '50');

    if (this.actionFilter) {
      params = params.set('action', this.actionFilter);
    }
    if (this.entityTypeFilter) {
      params = params.set('entityType', this.entityTypeFilter);
    }

    this.http
      .get<AuditLogResponse>(`${this.apiUrl}/admin/audit/logs`, { params })
      .pipe(
        map((response) => response),
        catchError((error) => {
          console.error('❌ Error loading audit logs:', error);
          return of({
            data: [],
            meta: { total: 0, page: 1, limit: 50, hasMore: false }
          } as AuditLogResponse);
        })
      )
      .subscribe({
        next: (response) => {
          console.log('✅ Audit logs loaded:', response);
          this.logs.set(response.data || []);
          this.totalLogs.set(response.meta?.total || 0);
          this.hasMore.set(response.meta?.hasMore || false);
          this.totalPages.set(Math.ceil((response.meta?.total || 0) / 50));
          this.error.set(null);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('❌ Error in subscription:', error);
          this.logs.set([]);
          const errorMsg = error.status === 401 
            ? 'Unauthorized. Please log in again.' 
            : error.status === 403 
            ? 'You do not have permission to view audit logs.'
            : error.status === 0
            ? 'Unable to connect to the server. Please check your connection.'
            : `Error loading audit logs: ${error.message || 'Unknown error'}`;
          this.error.set(errorMsg);
          this.loading.set(false);
        },
      });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadLogs();
  }

  clearFilters(): void {
    this.actionFilter = '';
    this.entityTypeFilter = '';
    this.onFilterChange();
  }

  nextPage(): void {
    if (this.hasMore()) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadLogs();
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadLogs();
    }
  }

  formatTimestamp(timestamp: string): string {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getUserInitial(name: string): string {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  }

  formatEntityType(entityType: string): string {
    return entityType
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  viewChanges(log: AuditLog): void {
    this.selectedLog.set(log);
    this.showChangesModal.set(true);
  }

  closeChangesModal(): void {
    this.showChangesModal.set(false);
    this.selectedLog.set(null);
  }

  getChangedFields(): { field: string; oldValue: any; newValue: any }[] {
    const log = this.selectedLog();
    if (!log) return [];

    const oldValues = log.old_values || {};
    const newValues = log.new_values || {};
    const allFields = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

    return Array.from(allFields).map(field => ({
      field,
      oldValue: oldValues[field],
      newValue: newValues[field],
    }));
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  }

  hasChanges(): boolean {
    const log = this.selectedLog();
    if (!log) return false;
    return Object.keys(log.old_values || {}).length > 0 || Object.keys(log.new_values || {}).length > 0;
  }
}
