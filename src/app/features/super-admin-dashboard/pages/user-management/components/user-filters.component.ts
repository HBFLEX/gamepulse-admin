import { Component, input, output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TuiTextfield, TuiLabel } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';

interface Team {
  id: number;
  name: string;
  city?: string;
}

@Component({
  selector: 'app-user-filters',
  imports: [
    CommonModule,
    FormsModule,
    TuiTextfield,
    TuiLabel,
    TuiCardLarge,
  ],
  template: `
    <div tuiCardLarge class="filters-section">
      <div class="filters-grid">
        <div class="filter-group">
          <label tuiLabel>Search</label>
            <tui-textfield>
              <input
                tuiTextfield
                type="text"
                placeholder="Search by name, email, or username..."
                [(ngModel)]="searchValue"
                (ngModelChange)="onSearchChange($event)"
              />
            </tui-textfield>
        </div>

        <div class="filter-group">
          <label tuiLabel>Status</label>
          <select
            class="filter-select"
            [(ngModel)]="statusFilter"
            (ngModelChange)="onStatusFilterChange($event)"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div class="filter-group">
          <label tuiLabel>Verification</label>
          <select
            class="filter-select"
            [(ngModel)]="verificationFilter"
            (ngModelChange)="onVerificationFilterChange($event)"
          >
            <option value="all">All Users</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>

        <div class="filter-group">
          <label tuiLabel>Favorite Team</label>
          <select
            class="filter-select"
            [(ngModel)]="teamFilter"
            (ngModelChange)="onTeamFilterChange($event)"
          >
            <option value="all">All Teams</option>
            <option *ngFor="let team of teams()" [value]="team.id">{{ team.city }} {{ team.name }}</option>
          </select>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filters-section {
      padding: 1.5rem;

      .filters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        align-items: end;
      }

      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .filter-select {
        padding: 0.5rem;
        border: 1px solid var(--tui-border-normal);
        border-radius: 0.375rem;
        background: var(--tui-background-base);
        color: var(--tui-text-primary);
        font-size: 0.875rem;
        width: 100%;
      }
    }

    @media (max-width: 768px) {
      .filters-section .filters-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class UserFiltersComponent implements OnInit, OnChanges {
  // Inputs
  teams = input<Team[]>([]);
  searchTerm = input<string>('');
  statusFilter = input<'all' | 'active' | 'inactive'>('all');
  verificationFilter = input<'all' | 'verified' | 'unverified'>('all');
  teamFilter = input<string>('all');

  // Local state for form controls
  searchValue = '';

  // Outputs
  searchTermChange = output<string>();
  statusFilterChange = output<'all' | 'active' | 'inactive'>();
  verificationFilterChange = output<'all' | 'verified' | 'unverified'>();
  teamFilterChange = output<string>();

  ngOnInit() {
    // Initialize local search value from input
    this.searchValue = this.searchTerm();
  }

  ngOnChanges() {
    // Update local search value when input changes
    this.searchValue = this.searchTerm();
  }

  onSearchChange(value: string): void {
    this.searchValue = value;
    this.searchTermChange.emit(value);
  }

  onStatusFilterChange(value: 'all' | 'active' | 'inactive'): void {
    this.statusFilterChange.emit(value);
  }

  onVerificationFilterChange(value: 'all' | 'verified' | 'unverified'): void {
    this.verificationFilterChange.emit(value);
  }

  onTeamFilterChange(value: string): void {
    this.teamFilterChange.emit(value);
  }
}