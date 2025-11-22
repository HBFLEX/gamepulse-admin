import { Component, OnInit, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TuiButton, TuiIcon, TuiLoader, TuiLabel, TuiAlertService, TuiHint, TuiTextfield, TuiTextfieldComponent } from '@taiga-ui/core';
import { TuiInputModule } from '@taiga-ui/legacy';
import { TuiCardLarge } from '@taiga-ui/layout';
import { environment } from '../../../../../environments/environment';
import { TeamsApiService, League, Division, Conference } from '../../../../core/services/teams-api.service';
import { Coach, CoachesApiService } from '../../../../core/services/coaches-api.service';

interface Team {
  id: number;
  name: string;
  city: string;
  arena: string;
  foundedYear: number;
  championships?: number;
  league?: string;
  division?: string;
  conference?: string;
  coach?: {
    id: number;
    name?: string;
    firstName?: string;
    lastName?: string;
    coach_first_name?: string;
    coach_last_name?: string;
    experienceYears?: number;
    coach_experience_years?: number;
  };
  logo?: string;
  is_active: boolean;
}

interface CreateTeamDto {
  name: string;
  city: string;
  arena: string;
  foundedYear: number;
  championshipsWon?: number;
  leagueId: number | undefined;
  divisionId?: number;
  conferenceId?: number;
  coachId?: number | null;
  logo?: string;
}

interface UpdateTeamDto {
  name?: string;
  city?: string;
  arena?: string;
  foundedYear?: number;
  championshipsWon?: number;
  conferenceId?: number;
  divisionId?: number;
  coachId?: number | null;
  logo?: string;
}

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TuiButton,
    TuiIcon,
    TuiLabel,
    TuiLoader,
    TuiHint,
    TuiTextfield,
    TuiTextfieldComponent,
    TuiInputModule,
    TuiCardLarge,
  ],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.less',
})
export class TeamsComponent implements OnInit {
  private http = inject(HttpClient);
  private alerts = inject(TuiAlertService);
  private teamsApi = inject(TeamsApiService);
  private coachesApi = inject(CoachesApiService);
  private apiUrl = `${environment.apiUrl}/teams`;

  // Metadata
  leagues = signal<League[]>([]);
  divisions = signal<Division[]>([]);
  conferences = signal<Conference[]>([]);
  coaches = signal<Coach[]>([]);

  // State
  loading = signal(false);
  teams = signal<Team[]>([]);
  selectedTeamIds = signal<Set<number>>(new Set());

  // Filters
  searchQuery = signal('');
  filterLeague = signal('');
  filterDivision = signal('');
  filterConference = signal('');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(20);
  totalTeams = signal(0);
  hasMore = signal(false);

  // Sorting
  sortColumn = signal<string>('name');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Modals
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  showBulkDeleteModal = signal(false);
  showViewModal = signal(false);
  selectedTeam = signal<Team | null>(null);
  teamDetails = signal<any>(null);

  // Form Data
  formData = signal<CreateTeamDto>({
    name: '',
    city: '',
    arena: '',
    foundedYear: new Date().getFullYear(),
    championshipsWon: 0,
    leagueId: 0,
    divisionId: undefined,
    conferenceId: undefined,
    coachId: undefined,
    logo: '',
  });

  formError = signal<string | null>(null);

  // File Upload
  selectedFile = signal<File | null>(null);
  logoPreview = signal<string | null>(null);
  uploadProgress = signal<number>(0);
  isUploading = signal(false);

  // Computed
  filteredTeams = computed(() => {
    const teams = this.teams();
    if (!teams || !Array.isArray(teams) || teams.length === 0) return [];

    let filtered = [...teams];

    // Search
    const query = this.searchQuery();
    if (query && query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(team =>
        (team.name?.toLowerCase() || '').includes(lowerQuery) ||
        (team.city?.toLowerCase() || '').includes(lowerQuery) ||
        (team.arena?.toLowerCase() || '').includes(lowerQuery) ||
        (team.league?.toLowerCase() || '').includes(lowerQuery)
      );
    }

    // Filter by league
    const league = this.filterLeague();
    if (league) {
      filtered = filtered.filter(team => team.league === league);
    }

    // Filter by division
    const division = this.filterDivision();
    if (division) {
      filtered = filtered.filter(team => team.division === division);
    }

    // Filter by conference
    const conference = this.filterConference();
    if (conference) {
      filtered = filtered.filter(team => team.conference === conference);
    }

    // Sort
    const col = this.sortColumn();
    const dir = this.sortDirection();
    filtered.sort((a, b) => {
      let aVal: any = a[col as keyof Team];
      let bVal: any = b[col as keyof Team];

      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      if (aVal < bVal) return dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  });

  displayedTeams = computed(() => {
    const filtered = this.filteredTeams();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    const end = start + size;
    return filtered.slice(start, end);
  });

  totalPages = computed(() => Math.ceil(this.filteredTeams().length / this.pageSize()));

  selectedCount = computed(() => this.selectedTeamIds().size);

  constructor() {
    // Reset to page 1 when filters change
    effect(() => {
      this.searchQuery();
      this.filterLeague();
      this.filterDivision();
      this.filterConference();
      this.currentPage.set(1);
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.loadMetadata();
    this.loadTeams();
  }

  loadMetadata(): void {
    // Load leagues
    this.teamsApi.getLeagues().subscribe({
      next: (response) => {
        this.leagues.set(response.data || []);
      },
      error: (error) => {
        console.error('Error loading leagues:', error);
      },
    });

    // Load divisions
    this.teamsApi.getDivisions().subscribe({
      next: (response) => {
        this.divisions.set(response.data || []);
      },
      error: (error) => {
        console.error('Error loading divisions:', error);
      },
    });

    // Load conferences
    this.teamsApi.getConferences().subscribe({
      next: (response) => {
        this.conferences.set(response.data || []);
      },
      error: (error) => {
        console.error('Error loading conferences:', error);
      },
    });

    // Load coaches
    this.coachesApi.getCoaches({ limit: 100 }).subscribe({
      next: (response) => {
        this.coaches.set(response.data || []);
      },
      error: (error) => {
        console.error('Error loading coaches:', error);
      },
    });
  }

  loadTeams(): void {
    this.loading.set(true);
    this.http.get<{ data: Team[]; meta: { total: number } }>(this.apiUrl).subscribe({
      next: (response) => {
        const teams = response?.data || [];
        this.teams.set(teams);
        this.totalTeams.set(response?.meta?.total || teams.length);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading teams:', error);
        this.alerts.open('Failed to load teams', { appearance: 'error' }).subscribe();
        this.loading.set(false);
      },
    });
  }

  loadTeamsInBackground(): void {
    // Load teams without showing loading indicator
    this.http.get<{ data: Team[]; meta: { total: number } }>(this.apiUrl).subscribe({
      next: (response) => {
        const teams = response?.data || [];
        this.teams.set(teams);
        this.totalTeams.set(response?.meta?.total || teams.length);
      },
      error: (error) => {
        console.error('Error loading teams in background:', error);
      },
    });
  }

  // Selection
  toggleSelection(teamId: number): void {
    const selected = new Set(this.selectedTeamIds());
    if (selected.has(teamId)) {
      selected.delete(teamId);
    } else {
      selected.add(teamId);
    }
    this.selectedTeamIds.set(selected);
  }

  toggleSelectAll(): void {
    const displayed = this.displayedTeams();
    if (displayed.length === 0) return;

    const allSelected = displayed.every(team => this.selectedTeamIds().has(team.id));

    if (allSelected) {
      this.selectedTeamIds.set(new Set());
    } else {
      this.selectedTeamIds.set(new Set(displayed.map(team => team.id)));
    }
  }

  clearSelection(): void {
    this.selectedTeamIds.set(new Set());
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

  // File Upload
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.handleFile(input.files[0]);
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  handleFile(file: File): void {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.formError.set('Please upload a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.formError.set('File size must be less than 5MB');
      return;
    }

    this.selectedFile.set(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.logoPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    this.formError.set(null);
  }

  clearFile(): void {
    this.selectedFile.set(null);
    this.logoPreview.set(null);
    this.uploadProgress.set(0);
  }

  async uploadLogo(teamId?: number): Promise<string | null> {
    const file = this.selectedFile();
    if (!file) return null;

    this.isUploading.set(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Build URL with entityType and optionally entityId
      let uploadUrl = `${environment.apiUrl}/media/admin/upload?type=image&entityType=team`;
      if (teamId) {
        uploadUrl += `&entityId=${teamId}`;
      }

      const response = await this.http.post<any>(uploadUrl, formData).toPromise();

      this.isUploading.set(false);
      return response.data?.file_url || response.url || response.data?.url;
    } catch (error) {
      console.error('Error uploading logo:', error);
      this.isUploading.set(false);
      throw error;
    }
  }

  // Create
  openCreateModal(): void {
    this.formData.set({
      name: '',
      city: '',
      arena: '',
      foundedYear: new Date().getFullYear(),
      championshipsWon: 0,
      leagueId: 0,
      divisionId: undefined,
      conferenceId: undefined,
      coachId: null,  // Default to null (no coach)
      logo: '',
    });
    this.formError.set(null);
    this.clearFile();
    this.showCreateModal.set(true);
  }

  async createTeam(): Promise<void> {
    this.formError.set(null);
    const data = this.formData();

    if (!data.name || !data.city || !data.arena || !data.foundedYear || !data.leagueId || !data.conferenceId) {
      this.formError.set('Please fill in all required fields');
      return;
    }

    this.loading.set(true);

    try {
      // Upload logo if file selected
      let logoUrl = data.logo;
      if (this.selectedFile()) {
        logoUrl = await this.uploadLogo() || '';
      }

      const teamData = { ...data, logo: logoUrl };

      this.http.post<Team>(`${this.apiUrl}/admin`, teamData).subscribe({
        next: () => {
          this.alerts.open('Team created successfully', { appearance: 'success' }).subscribe();
          this.showCreateModal.set(false);
          this.loadTeams();
        },
        error: (error) => {
          console.error('Error creating team:', error);
          this.formError.set(error.error?.message || 'Failed to create team');
          this.loading.set(false);
        },
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      this.formError.set('Failed to upload logo');
      this.loading.set(false);
    }
  }

  // Edit
  openEditModal(team: Team): void {
    this.selectedTeam.set(team);

    // Find matching league, division, conference by name
    const matchingLeague = this.leagues().find(l => l.name === team.league);
    const matchingDivision = this.divisions().find(d => d.name === team.division);
    const matchingConference = this.conferences().find(c => c.name === team.conference);

    this.formData.set({
      name: team.name,
      city: team.city,
      arena: team.arena,
      foundedYear: team.foundedYear,
      championshipsWon: team.championships || 0,
      leagueId: matchingLeague?.id || undefined,
      divisionId: matchingDivision?.id || undefined,
      conferenceId: matchingConference?.id || undefined,
      coachId: team.coach?.id || null,  // Use null instead of undefined for teams without coaches
      logo: team.logo || '',
    });
    this.formError.set(null);

    // Clear file selection but keep the preview if team has a logo
    this.selectedFile.set(null);

    // Set logo preview to existing team logo
    if (team.logo) {
      this.logoPreview.set(team.logo);
    } else {
      this.logoPreview.set(null);
    }

    this.showEditModal.set(true);
  }

  async updateTeam(): Promise<void> {
    this.formError.set(null);
    const team = this.selectedTeam();
    if (!team) return;

    try {
      // Upload new logo if file selected - pass team ID so server can update team_logo field
      let logoUrl = this.formData().logo;
      if (this.selectedFile()) {
        logoUrl = await this.uploadLogo(team.id) || '';
        // Update preview with new uploaded URL
        if (logoUrl) {
          this.logoPreview.set(logoUrl);
        }
      }

      const data: UpdateTeamDto = {
        name: this.formData().name,
        city: this.formData().city,
        arena: this.formData().arena,
        foundedYear: this.formData().foundedYear,
        championshipsWon: this.formData().championshipsWon,
        conferenceId: this.formData().conferenceId,
        divisionId: this.formData().divisionId,
        logo: logoUrl || undefined,
      };

      // Don't include coachId in the update DTO - we'll handle coach assignment separately
      const coachIdChanged = this.formData().coachId !== team.coach?.id;
      const newCoachId = this.formData().coachId;

      // Optimistically update the UI immediately
      const teamIndex = this.teams().findIndex(t => t.id === team.id);
      if (teamIndex !== -1) {
        const updatedTeams = [...this.teams()];
        const selectedLeague = this.leagues().find(l => l.id === this.formData().leagueId);
        const selectedDivision = this.divisions().find(d => d.id === data.divisionId);
        const selectedConference = this.conferences().find(c => c.id === data.conferenceId);

        // Handle coach assignment: null means remove coach, number means assign coach
        let coachValue: Team['coach'] = updatedTeams[teamIndex].coach;
        if (newCoachId === null) {
          // Explicitly removing coach
          coachValue = undefined;
        } else if (newCoachId) {
          // Assigning a coach
          const selectedCoach = this.coaches().find(c => c.id === newCoachId);
          if (selectedCoach) {
            coachValue = {
              id: selectedCoach.id,
              name: `${selectedCoach.coach_first_name} ${selectedCoach.coach_last_name}`,
              experienceYears: selectedCoach.coach_experience_years,
            };
          }
        }

        updatedTeams[teamIndex] = {
          ...updatedTeams[teamIndex],
          name: data.name || updatedTeams[teamIndex].name,
          city: data.city || updatedTeams[teamIndex].city,
          arena: data.arena || updatedTeams[teamIndex].arena,
          foundedYear: data.foundedYear || updatedTeams[teamIndex].foundedYear,
          championships: data.championshipsWon,
          league: selectedLeague?.name || updatedTeams[teamIndex].league,
          division: selectedDivision?.name || updatedTeams[teamIndex].division,
          conference: selectedConference?.name || updatedTeams[teamIndex].conference,
          logo: logoUrl || updatedTeams[teamIndex].logo,
          coach: coachValue,
        };
        this.teams.set(updatedTeams);
      }

      // Close modal immediately for better UX
      this.showEditModal.set(false);

      // Update team basic info first
      this.http.put<Team>(`${this.apiUrl}/admin/${team.id}`, data).subscribe({
        next: () => {
          // If coach assignment changed, update it separately
          if (coachIdChanged) {
            if (newCoachId === null) {
              // Remove coach using DELETE endpoint
              this.http.delete(`${this.apiUrl}/admin/${team.id}/coach`).subscribe({
                next: () => {
                  this.loadTeamsInBackground();
                  this.alerts.open('Team updated and coach removed successfully', { appearance: 'success' }).subscribe();
                },
                error: (error) => {
                  console.error('Error removing coach:', error);
                  this.loadTeams();
                  this.alerts.open('Team updated but failed to remove coach', { appearance: 'warning' }).subscribe();
                }
              });
            } else {
              // Assign new coach using the dedicated endpoint
              this.http.put(`${this.apiUrl}/admin/${team.id}/coach`, { coachId: newCoachId }).subscribe({
                next: () => {
                  this.loadTeamsInBackground();
                  this.alerts.open('Team and coach updated successfully', { appearance: 'success' }).subscribe();
                },
                error: (error) => {
                  console.error('Error assigning coach:', error);
                  this.loadTeams();
                  this.alerts.open('Team updated but failed to assign coach', { appearance: 'warning' }).subscribe();
                }
              });
            }
          } else {
            // Optionally reload to sync with server (silent background refresh)
            this.loadTeamsInBackground();
            this.alerts.open('Team updated successfully', { appearance: 'success' }).subscribe();
          }
        },
        error: (error) => {
          console.error('Error updating team:', error);
          // Revert the optimistic update on error and show the error
          this.loadTeams();
          this.alerts.open(error.error?.message || 'Failed to update team', { appearance: 'error' }).subscribe();
        },
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      this.formError.set('Failed to upload logo');
    }
  }

  // View Details
  openViewModal(team: Team): void {
    this.selectedTeam.set(team);
    this.showViewModal.set(true);
    this.loadTeamDetails(team.id);
  }

  loadTeamDetails(teamId: number): void {
    this.loading.set(true);

    // Fetch both team details and stats
    const detailsRequest = this.http.get<any>(`${this.apiUrl}/${teamId}`);
    const statsRequest = this.http.get<any>(`${this.apiUrl}/${teamId}/stats`);

    // Use Promise.all to fetch both concurrently
    Promise.all([
      detailsRequest.toPromise(),
      statsRequest.toPromise()
    ]).then(([details, stats]) => {
      // Combine the data, excluding standings
      const { standings, ...restOfDetails } = details;
      this.teamDetails.set({
        ...restOfDetails,
        stats: stats
      });
      this.loading.set(false);
    }).catch((error) => {
      console.error('Error loading team details:', error);
      this.alerts.open('Failed to load team details', { appearance: 'error' }).subscribe();
      this.loading.set(false);
    });
  }

  // Delete
  openDeleteModal(team: Team): void {
    this.selectedTeam.set(team);
    this.showDeleteModal.set(true);
  }

  deleteTeam(): void {
    const team = this.selectedTeam();
    if (!team) return;

    // Optimistically remove from UI immediately
    const updatedTeams = this.teams().filter(t => t.id !== team.id);
    this.teams.set(updatedTeams);
    this.totalTeams.set(this.totalTeams() - 1);

    // Close modal immediately for better UX
    this.showDeleteModal.set(false);

    // Then delete on the server in the background
    this.http.delete(`${this.apiUrl}/admin/${team.id}`).subscribe({
      next: () => {
        console.log('Team deleted successfully');
        // Optionally reload to sync with server
        this.loadTeamsInBackground();
        this.alerts.open('Team deleted successfully', { appearance: 'success' }).subscribe();
      },
      error: (error) => {
        console.error('Error deleting team:', error);
        // Revert the optimistic update on error
        this.loadTeams();
        this.alerts.open(error.error?.message || 'Failed to delete team', { appearance: 'error' }).subscribe();
      },
    });
  }

  // Bulk Delete
  openBulkDeleteModal(): void {
    if (this.selectedCount() === 0) return;
    this.showBulkDeleteModal.set(true);
  }

  bulkDeleteTeams(): void {
    const ids = Array.from(this.selectedTeamIds());
    if (ids.length === 0) return;

    // Optimistically remove from UI
    const updatedTeams = this.teams().filter(team => !ids.includes(team.id));
    this.teams.set(updatedTeams);
    this.totalTeams.set(this.totalTeams() - ids.length);
    this.selectedTeamIds.set(new Set());
    this.showBulkDeleteModal.set(false);

    // Delete on server
    const deleteRequests = ids.map(id => this.http.delete(`${this.apiUrl}/admin/${id}`));

    let completed = 0;
    let failed = 0;

    deleteRequests.forEach(request => {
      request.subscribe({
        next: () => {
          completed++;
          if (completed + failed === ids.length) {
            this.loadTeamsInBackground();
            if (failed === 0) {
              this.alerts
                .open(`Successfully deleted ${completed} team(s)`, {
                  appearance: 'success',
                  label: 'Success',
                  autoClose: 3000,
                })
                .subscribe();
            } else {
              this.alerts
                .open(`Deleted ${completed} team(s), failed to delete ${failed}`, {
                  appearance: 'warning',
                  label: 'Partial Success',
                  autoClose: 5000,
                })
                .subscribe();
            }
          }
        },
        error: () => {
          failed++;
          if (completed + failed === ids.length) {
            if (failed === ids.length) {
              this.loadTeams();
              this.alerts
                .open('Failed to delete teams', {
                  appearance: 'error',
                  label: 'Delete Failed',
                  autoClose: 5000,
                })
                .subscribe();
            } else {
              this.loadTeamsInBackground();
              this.alerts
                .open(`Deleted ${completed} team(s), failed to delete ${failed}`, {
                  appearance: 'warning',
                  label: 'Partial Success',
                  autoClose: 5000,
                })
                .subscribe();
            }
          }
        }
      });
    });
  }

  // Helpers
  isTeamSelected(teamId: number): boolean {
    return this.selectedTeamIds().has(teamId);
  }

  isAllSelected(): boolean {
    const displayed = this.displayedTeams();
    return displayed.length > 0 && displayed.every(team => this.selectedTeamIds().has(team.id));
  }

  isSomeSelected(): boolean {
    const displayed = this.displayedTeams();
    const selectedCount = displayed.filter(team => this.selectedTeamIds().has(team.id)).length;
    return selectedCount > 0 && selectedCount < displayed.length;
  }

  getTeamInitials(team: Team): string {
    return team.name.substring(0, 2).toUpperCase();
  }

  formatWinPercentage(percentage: number | undefined): string {
    if (percentage === undefined) return '-';
    return (percentage * 100).toFixed(1) + '%';
  }

  formatDate(date: string): string {
    if (!date) return '-';
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '-';
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  closeAllModals(): void {
    this.showCreateModal.set(false);
    this.showEditModal.set(false);
    this.showDeleteModal.set(false);
    this.showBulkDeleteModal.set(false);
    this.showViewModal.set(false);
    this.selectedTeam.set(null);
    this.teamDetails.set(null);
    this.formError.set(null);
    this.clearFile();
  }

  updateFormField(field: keyof CreateTeamDto, value: string | number | undefined): void {
    const currentData = this.formData();
    this.formData.set({
      ...currentData,
      [field]: value,
    });
  }

  getCoachName(team: Team): string {
    if (!team.coach) return '-';

    console.log('Coach data for team:', team.name, team.coach);

    // Handle both name formats: direct name or firstName/lastName
    if ('name' in team.coach && team.coach.name) {
      return team.coach.name;
    }
    if ('firstName' in team.coach || 'lastName' in team.coach) {
      const firstName = (team.coach as any).firstName || '';
      const lastName = (team.coach as any).lastName || '';
      return `${firstName} ${lastName}`.trim();
    }

    // Handle coach_first_name and coach_last_name format (from API)
    if ('coach_first_name' in team.coach || 'coach_last_name' in team.coach) {
      const firstName = (team.coach as any).coach_first_name || '';
      const lastName = (team.coach as any).coach_last_name || '';
      return `${firstName} ${lastName}`.trim();
    }

    return '-';
  }

  getCoachFullName(coachId: number | undefined): string {
    if (!coachId) return 'No coach assigned';
    const coach = this.coaches().find(c => c.id === coachId);
    if (!coach) return 'No coach assigned';
    return `${coach.coach_first_name} ${coach.coach_last_name}`;
  }

  protected readonly Math = Math;
}
