import { Component, OnInit, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TuiButton, TuiIcon, TuiLoader, TuiAlertService, TuiTextfield, TuiLabel } from '@taiga-ui/core';
import { TuiInputModule, TuiInputNumberModule } from '@taiga-ui/legacy';
import { TuiTabs } from '@taiga-ui/kit';
import { environment } from '../../../../../environments/environment';
import { CoachesApiService, Coach, CoachDetails } from '../../../../core/services/coaches-api.service';
import { CoachDetailsTabComponent } from './tabs/coach-details-tab.component';
import { CoachHistoryTabComponent } from './tabs/coach-history-tab.component';

interface Team {
  id: number;
  name: string;
  city?: string;
}

interface CoachWithTeam extends Coach {
  currentTeam?: Team;
}

interface CreateCoachDto {
  firstName: string;
  lastName: string;
  birthDate?: string;
  nationality?: string;
  experienceYears?: number;
}

interface UpdateCoachDto {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  nationality?: string;
  experienceYears?: number;
}

@Component({
  selector: 'app-coaches',
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
    TuiInputNumberModule,
    TuiTabs,
    CoachDetailsTabComponent,
    CoachHistoryTabComponent,
  ],
  templateUrl: './coaches.component.html',
  styleUrl: './coaches.component.less'
})
export class CoachesComponent implements OnInit {
  private http = inject(HttpClient);
  private alerts = inject(TuiAlertService);
  private coachesApi = inject(CoachesApiService);

  private apiUrl = `${environment.apiUrl}/coaches`;

  // State
  coaches = signal<CoachWithTeam[]>([]);
  teams = signal<Team[]>([]);
  loading = signal(false);
  selectedCoachIds = signal(new Set<number>());

  // Search & Filters
  searchQuery = signal('');
  filterNationality = signal('');

  // Sorting
  sortColumn = signal<string>('coach_last_name');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(20);
  totalCoaches = signal(0);

  // Modal state
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  showBulkDeleteModal = signal(false);
  showCoachDetailsModal = signal(false);
  selectedCoach = signal<Coach | null>(null);
  activeTab = signal(0);

  // Form data
  coachForm = signal<Partial<CreateCoachDto>>({});

  // Computed
  filteredCoaches = computed(() => {
    const coaches = this.coaches();
    if (!coaches || !Array.isArray(coaches) || coaches.length === 0) return [];

    let filtered = [...coaches];

    // Search
    const query = this.searchQuery();
    if (query && query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(coach =>
        (coach.coach_first_name?.toLowerCase() || '').includes(lowerQuery) ||
        (coach.coach_last_name?.toLowerCase() || '').includes(lowerQuery) ||
        (coach.coach_nationality?.toLowerCase() || '').includes(lowerQuery)
      );
    }

    // Filter by nationality
    const nationality = this.filterNationality();
    if (nationality) {
      filtered = filtered.filter(coach => coach.coach_nationality === nationality);
    }

    // Sort
    const col = this.sortColumn();
    const dir = this.sortDirection();
    filtered.sort((a, b) => {
      let aVal: any = a[col as keyof Coach];
      let bVal: any = b[col as keyof Coach];

      if (col === 'age') {
        aVal = this.calculateAge(a.coach_birth_date);
        bVal = this.calculateAge(b.coach_birth_date);
      }

      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      if (aVal < bVal) return dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  });

  displayedCoaches = computed(() => {
    const filtered = this.filteredCoaches();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    const end = start + size;
    return filtered.slice(start, end);
  });

  totalPages = computed(() => Math.ceil(this.filteredCoaches().length / this.pageSize()));

  selectedCount = computed(() => this.selectedCoachIds().size);

  uniqueNationalities = computed(() => {
    const coaches = this.coaches();
    const nationalities = new Set<string>();
    coaches.forEach(coach => {
      if (coach.coach_nationality) nationalities.add(coach.coach_nationality);
    });
    return Array.from(nationalities).sort();
  });

  constructor() {
    // Reset to page 1 when filters change
    effect(() => {
      this.searchQuery();
      this.filterNationality();
      this.currentPage.set(1);
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.loadCoaches();
    this.loadTeams();
  }

  loadCoaches(): void {
    this.loading.set(true);
    this.coachesApi.getCoaches({ limit: 1000 }).subscribe({
      next: async (response) => {
        const coaches = response?.data || [];
        
        // Fetch team data for all coaches
        const coachesWithTeams = await this.enrichCoachesWithTeamData(coaches);
        
        this.coaches.set(coachesWithTeams);
        this.totalCoaches.set(response?.pagination?.total || coaches.length);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading coaches:', error);
        this.alerts.open('Failed to load coaches', { appearance: 'error' }).subscribe();
        this.loading.set(false);
      },
    });
  }

  private async enrichCoachesWithTeamData(coaches: Coach[]): Promise<Coach[]> {
    // Get all teams
    const teams = this.teams();
    
    // Create a map of coach_id to team for quick lookup
    const coachTeamMap = new Map<number, Team>();
    
    // Fetch teams and build the map
    try {
      const teamsResponse = await this.http.get<{ data: any[] }>(`${environment.apiUrl}/teams?limit=1000`).toPromise();
      const allTeams = teamsResponse?.data || [];
      
      allTeams.forEach((team: any) => {
        if (team.team_coach_id) {
          coachTeamMap.set(team.team_coach_id, {
            id: team.id,
            name: team.team_name || team.name,
            city: team.team_city || team.city
          });
        }
      });
    } catch (error) {
      console.error('Error fetching teams for coaches:', error);
    }
    
    // Enrich coaches with team data
    return coaches.map(coach => ({
      ...coach,
      currentTeam: coachTeamMap.get(coach.id)
    }));
  }

  loadCoachesInBackground(): void {
    this.coachesApi.getCoaches({ limit: 1000 }).subscribe({
      next: (response) => {
        const coaches = response?.data || [];
        this.coaches.set(coaches);
        this.totalCoaches.set(response?.pagination?.total || coaches.length);
      },
      error: (error) => {
        console.error('Error loading coaches in background:', error);
      },
    });
  }

  loadTeams(): void {
    this.http.get<{ data: any[] }>(`${environment.apiUrl}/teams?limit=1000`).subscribe({
      next: (response: any) => {
        const teams = response?.data || [];
        this.teams.set(teams.map((t: any) => ({ id: t.id, name: t.name, city: t.city })));
      },
      error: (error: any) => {
        console.error('Error loading teams:', error);
      },
    });
  }

  // Selection
  toggleSelection(coachId: number): void {
    const selected = new Set(this.selectedCoachIds());
    if (selected.has(coachId)) {
      selected.delete(coachId);
    } else {
      selected.add(coachId);
    }
    this.selectedCoachIds.set(selected);
  }

  isSelected(coachId: number): boolean {
    return this.selectedCoachIds().has(coachId);
  }

  toggleSelectAll(): void {
    const displayed = this.displayedCoaches();
    if (displayed.length === 0) return;

    const allSelected = displayed.every(coach => this.selectedCoachIds().has(coach.id));

    if (allSelected) {
      this.selectedCoachIds.set(new Set());
    } else {
      this.selectedCoachIds.set(new Set(displayed.map(coach => coach.id)));
    }
  }

  areAllSelected(): boolean {
    const displayed = this.displayedCoaches();
    if (displayed.length === 0) return false;
    return displayed.every(coach => this.selectedCoachIds().has(coach.id));
  }

  clearSelection(): void {
    this.selectedCoachIds.set(new Set());
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
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getCoachTeam(coach: CoachWithTeam): Team | null {
    return coach.currentTeam || null;
  }

  // CRUD Operations
  openCreateModal(): void {
    this.coachForm.set({
      experienceYears: 0,
    });
    this.showCreateModal.set(true);
  }

  openEditModal(coach: Coach): void {
    this.selectedCoach.set(coach);
    this.coachForm.set({
      firstName: coach.coach_first_name,
      lastName: coach.coach_last_name,
      birthDate: coach.coach_birth_date,
      nationality: coach.coach_nationality,
      experienceYears: coach.coach_experience_years,
    });
    this.showEditModal.set(true);
  }

  openDeleteModal(coach: Coach): void {
    this.selectedCoach.set(coach);
    this.showDeleteModal.set(true);
  }

  openBulkDeleteModal(): void {
    this.showBulkDeleteModal.set(true);
  }

  openCoachDetailsModal(coach: Coach): void {
    this.selectedCoach.set(coach);
    this.activeTab.set(0);
    this.showCoachDetailsModal.set(true);
  }

  closeModals(): void {
    this.showCreateModal.set(false);
    this.showEditModal.set(false);
    this.showDeleteModal.set(false);
    this.showBulkDeleteModal.set(false);
    this.showCoachDetailsModal.set(false);
    this.selectedCoach.set(null);
    this.coachForm.set({});
    this.activeTab.set(0);
  }

  createCoach(): void {
    const form = this.coachForm();
    if (!this.validateCoachForm(form)) {
      this.alerts.open('Please fill all required fields', { appearance: 'error' }).subscribe();
      return;
    }

    this.loading.set(true);
    this.http.post(`${this.apiUrl}/admin`, form).subscribe({
      next: () => {
        this.closeModals();
        this.alerts.open('Coach created successfully', { appearance: 'success' }).subscribe();
        this.loadCoaches();
      },
      error: (error) => {
        console.error('Error creating coach:', error);
        this.alerts.open('Failed to create coach', { appearance: 'error' }).subscribe();
        this.loading.set(false);
      },
    });
  }

  updateCoach(): void {
    const coach = this.selectedCoach();
    if (!coach) return;

    const form = this.coachForm();

    // Optimistically update UI
    const coachIndex = this.coaches().findIndex(c => c.id === coach.id);
    if (coachIndex !== -1) {
      const updatedCoaches = [...this.coaches()];
      const currentCoach = updatedCoaches[coachIndex];
      updatedCoaches[coachIndex] = {
        ...currentCoach,
        coach_first_name: form.firstName || currentCoach.coach_first_name,
        coach_last_name: form.lastName || currentCoach.coach_last_name,
        coach_birth_date: form.birthDate || currentCoach.coach_birth_date,
        coach_nationality: form.nationality || currentCoach.coach_nationality,
        coach_experience_years: form.experienceYears !== undefined ? form.experienceYears : currentCoach.coach_experience_years,
      };
      this.coaches.set(updatedCoaches);
    }

    this.closeModals();

    this.http.put(`${this.apiUrl}/admin/${coach.id}`, form).subscribe({
      next: () => {
        this.loadCoachesInBackground();
        this.alerts.open('Coach updated successfully', { appearance: 'success' }).subscribe();
      },
      error: (error) => {
        console.error('Error updating coach:', error);
        this.loadCoaches();
        this.alerts.open('Failed to update coach', { appearance: 'error' }).subscribe();
      },
    });
  }

  deleteCoach(): void {
    const coach = this.selectedCoach();
    if (!coach) return;

    // Optimistically remove from UI
    const updatedCoaches = this.coaches().filter(c => c.id !== coach.id);
    this.coaches.set(updatedCoaches);
    this.totalCoaches.set(this.totalCoaches() - 1);

    this.closeModals();

    this.http.delete(`${this.apiUrl}/admin/${coach.id}`).subscribe({
      next: () => {
        this.loadCoachesInBackground();
        this.alerts.open('Coach deleted successfully', { appearance: 'success' }).subscribe();
      },
      error: (error) => {
        console.error('Error deleting coach:', error);
        this.loadCoaches();
        this.alerts.open('Failed to delete coach', { appearance: 'error' }).subscribe();
      },
    });
  }

  bulkDeleteCoaches(): void {
    const ids = Array.from(this.selectedCoachIds());
    if (ids.length === 0) return;

    // Optimistically remove from UI
    const updatedCoaches = this.coaches().filter(coach => !ids.includes(coach.id));
    this.coaches.set(updatedCoaches);
    this.totalCoaches.set(this.totalCoaches() - ids.length);
    this.selectedCoachIds.set(new Set());
    this.closeModals();

    let completed = 0;
    let failed = 0;

    ids.forEach(id => {
      this.http.delete(`${this.apiUrl}/admin/${id}`).subscribe({
        next: () => {
          completed++;
          if (completed + failed === ids.length) {
            this.loadCoachesInBackground();
            if (failed === 0) {
              this.alerts.open(`Successfully deleted ${completed} coach(es)`, { appearance: 'success' }).subscribe();
            } else {
              this.alerts.open(`Deleted ${completed} coach(es), ${failed} failed`, { appearance: 'warning' }).subscribe();
            }
          }
        },
        error: () => {
          failed++;
          if (completed + failed === ids.length) {
            if (failed === ids.length) {
              this.loadCoaches();
              this.alerts.open('Failed to delete coaches', { appearance: 'error' }).subscribe();
            } else {
              this.loadCoachesInBackground();
              this.alerts.open(`Deleted ${completed} coach(es), ${failed} failed`, { appearance: 'warning' }).subscribe();
            }
          }
        },
      });
    });
  }

  private validateCoachForm(form: Partial<CreateCoachDto> | undefined): boolean {
    return !!(form?.firstName && form?.lastName);
  }

  updateFormField(field: string, value: any): void {
    const currentForm = this.coachForm();
    this.coachForm.set({ ...currentForm, [field]: value });
  }

  protected readonly Math = Math;
}
