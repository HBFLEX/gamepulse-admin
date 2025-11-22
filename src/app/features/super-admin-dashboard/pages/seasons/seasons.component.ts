import { Component, OnInit, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TuiButton, TuiIcon, TuiLoader, TuiAlertService, TuiTextfield, TuiLabel } from '@taiga-ui/core';
import { TuiInputModule } from '@taiga-ui/legacy';
import { TuiTabs } from '@taiga-ui/kit';
import { environment } from '../../../../../environments/environment';
import { SeasonDetailsTabComponent } from './tabs/season-details-tab.component';
import { SeasonGamesTabComponent } from './tabs/season-games-tab.component';

interface Season {
  id: number;
  season_year: string;
  season_type: string;
  created_at?: string;
}

interface CreateSeasonDto {
  seasonYear: string;
  seasonType: string;
}

@Component({
  selector: 'app-seasons',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TuiButton,
    TuiIcon,
    TuiLoader,
    TuiTextfield,
    TuiLabel,
    TuiInputModule,
    TuiTabs,
    SeasonDetailsTabComponent,
    SeasonGamesTabComponent,
  ],
  templateUrl: './seasons.component.html',
  styleUrl: './seasons.component.less'
})
export class SeasonsComponent implements OnInit {
  private http = inject(HttpClient);
  private alerts = inject(TuiAlertService);

  private apiUrl = `${environment.apiUrl}/games/admin/seasons`;

  // State
  seasons = signal<Season[]>([]);
  loading = signal(false);
  selectedSeasonIds = signal(new Set<number>());

  // Search & Filters
  searchQuery = signal('');
  filterType = signal('');

  // Sorting
  sortColumn = signal<string>('season_year');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(20);
  totalSeasons = signal(0);

  // Modal state
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  showBulkDeleteModal = signal(false);
  showSeasonDetailsModal = signal(false);
  selectedSeason = signal<Season | null>(null);
  activeTab = signal(0);

  // Form data
  seasonForm = signal<Partial<CreateSeasonDto>>({});

  // Season types
  seasonTypes = ['Regular Season', 'Playoffs', 'Preseason', 'Off-season'];

  // Computed
  filteredSeasons = computed(() => {
    const seasons = this.seasons();
    if (!seasons || !Array.isArray(seasons) || seasons.length === 0) return [];

    let filtered = [...seasons];

    // Search
    const query = this.searchQuery();
    if (query && query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(season =>
        (season.season_year?.toLowerCase() || '').includes(lowerQuery) ||
        (season.season_type?.toLowerCase() || '').includes(lowerQuery)
      );
    }

    // Filter by type
    const type = this.filterType();
    if (type) {
      filtered = filtered.filter(season => season.season_type === type);
    }

    // Sort
    const col = this.sortColumn();
    const dir = this.sortDirection();
    filtered.sort((a, b) => {
      let aVal: any = a[col as keyof Season];
      let bVal: any = b[col as keyof Season];

      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      if (aVal < bVal) return dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  });

  displayedSeasons = computed(() => {
    const filtered = this.filteredSeasons();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    const end = start + size;
    return filtered.slice(start, end);
  });

  totalPages = computed(() => Math.ceil(this.filteredSeasons().length / this.pageSize()));

  selectedCount = computed(() => this.selectedSeasonIds().size);

  uniqueTypes = computed(() => {
    const seasons = this.seasons();
    const types = new Set<string>();
    seasons.forEach(season => {
      if (season.season_type) types.add(season.season_type);
    });
    return Array.from(types).sort();
  });

  constructor() {
    // Reset to page 1 when filters change
    effect(() => {
      this.searchQuery();
      this.filterType();
      this.currentPage.set(1);
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.loadSeasons();
  }

  loadSeasons(): void {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/games/seasons`).subscribe({
      next: (response) => {
        const seasonsData = response?.data || [];
        const seasons = seasonsData.map((season: any) => ({
          id: season.id,
          season_year: season.season_year,
          season_type: season.season_type || 'Regular Season',
          created_at: season.created_at
        }));
        this.seasons.set(seasons);
        this.totalSeasons.set(seasons.length);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading seasons:', error);
        this.alerts.open('Failed to load seasons', { appearance: 'error' }).subscribe();
        this.loading.set(false);
      },
    });
  }

  loadSeasonsInBackground(): void {
    this.http.get<any>(`${environment.apiUrl}/games/seasons`).subscribe({
      next: (response) => {
        const seasonsData = response?.data || [];
        const seasons = seasonsData.map((season: any) => ({
          id: season.id,
          season_year: season.season_year,
          season_type: season.season_type || 'Regular Season',
          created_at: season.created_at
        }));
        this.seasons.set(seasons);
        this.totalSeasons.set(seasons.length);
      },
      error: (error) => {
        console.error('Error loading seasons in background:', error);
      },
    });
  }

  // Selection
  toggleSelection(seasonId: number): void {
    const selected = new Set(this.selectedSeasonIds());
    if (selected.has(seasonId)) {
      selected.delete(seasonId);
    } else {
      selected.add(seasonId);
    }
    this.selectedSeasonIds.set(selected);
  }

  isSelected(seasonId: number): boolean {
    return this.selectedSeasonIds().has(seasonId);
  }

  toggleSelectAll(): void {
    const displayed = this.displayedSeasons();
    if (displayed.length === 0) return;

    const allSelected = displayed.every(season => this.selectedSeasonIds().has(season.id));

    if (allSelected) {
      this.selectedSeasonIds.set(new Set());
    } else {
      this.selectedSeasonIds.set(new Set(displayed.map(season => season.id)));
    }
  }

  areAllSelected(): boolean {
    const displayed = this.displayedSeasons();
    if (displayed.length === 0) return false;
    return displayed.every(season => this.selectedSeasonIds().has(season.id));
  }

  clearSelection(): void {
    this.selectedSeasonIds.set(new Set());
  }

  // Sorting
  sortBy(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  // Pagination
  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Utility
  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // CRUD Operations
  openCreateModal(): void {
    this.seasonForm.set({
      seasonType: 'Regular Season',
    });
    this.showCreateModal.set(true);
  }

  openEditModal(season: Season): void {
    this.selectedSeason.set(season);
    this.seasonForm.set({
      seasonYear: season.season_year,
      seasonType: season.season_type,
    });
    this.showEditModal.set(true);
  }

  openDeleteModal(season: Season): void {
    this.selectedSeason.set(season);
    this.showDeleteModal.set(true);
  }

  openBulkDeleteModal(): void {
    this.showBulkDeleteModal.set(true);
  }

  openSeasonDetailsModal(season: Season): void {
    this.selectedSeason.set(season);
    this.activeTab.set(0);
    this.showSeasonDetailsModal.set(true);
  }

  closeModals(): void {
    this.showCreateModal.set(false);
    this.showEditModal.set(false);
    this.showDeleteModal.set(false);
    this.showBulkDeleteModal.set(false);
    this.showSeasonDetailsModal.set(false);
    this.selectedSeason.set(null);
    this.seasonForm.set({});
    this.activeTab.set(0);
  }

  createSeason(): void {
    const form = this.seasonForm();
    if (!this.validateSeasonForm(form)) {
      this.alerts.open('Please fill all required fields', { appearance: 'error' }).subscribe();
      return;
    }

    this.loading.set(true);
    this.http.post(this.apiUrl, form).subscribe({
      next: () => {
        this.closeModals();
        this.alerts.open('Season created successfully', { appearance: 'success' }).subscribe();
        this.loadSeasons();
      },
      error: (error) => {
        console.error('Error creating season:', error);
        const errorMessage = error?.error?.message || error?.message || 'Failed to create season';
        this.alerts.open(errorMessage, { appearance: 'error' }).subscribe();
        this.loading.set(false);
      },
    });
  }

  updateSeason(): void {
    const season = this.selectedSeason();
    if (!season) return;

    const form = this.seasonForm();

    // Since update endpoint may not exist, show info message
    this.alerts.open('Season update functionality will be available soon', { appearance: 'info' }).subscribe();
    this.closeModals();
  }

  deleteSeason(): void {
    const season = this.selectedSeason();
    if (!season) return;

    // Since delete endpoint may not exist, show info message
    this.alerts.open('Season deletion will be available soon. Please contact system administrator.', { appearance: 'info' }).subscribe();
    this.closeModals();
  }

  bulkDeleteSeasons(): void {
    this.alerts.open('Bulk deletion will be available soon', { appearance: 'info' }).subscribe();
    this.closeModals();
  }

  private validateSeasonForm(form: Partial<CreateSeasonDto> | undefined): boolean {
    return !!(form?.seasonYear && form?.seasonType);
  }

  updateFormField(field: string, value: any): void {
    const currentForm = this.seasonForm();
    this.seasonForm.set({ ...currentForm, [field]: value });
  }

  protected readonly Math = Math;
}
