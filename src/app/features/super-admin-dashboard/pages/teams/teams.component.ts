import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TuiButton, TuiIcon, TuiLoader, TuiLabel, TuiAlertService, TuiHint, TuiTextfield, TuiTextfieldComponent } from '@taiga-ui/core';
import { TuiInputModule } from '@taiga-ui/legacy';
import { TuiCardLarge } from '@taiga-ui/layout';
import { TuiTable } from '@taiga-ui/addon-table';
import { environment } from '../../../../../environments/environment';
import { TeamsApiService, League, Division, Conference } from '../../../../core/services/teams-api.service';

interface Team {
  id: number;
  name: string;
  city: string;
  arena: string;
  foundedYear: number;
  championships?: number;
  league?: string;  // String, not object
  division?: string;  // String, not object
  conference?: string;  // String, not object
  coach?: {
    id: number;
    name: string;
    experienceYears: number;
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
  coachId?: number;
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
  coachId?: number;
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
    TuiTable,
  ],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.less',
})
export class TeamsComponent implements OnInit {
  private http = inject(HttpClient);
  private alerts = inject(TuiAlertService);
  private teamsApi = inject(TeamsApiService);
  private apiUrl = `${environment.apiUrl}/teams`;
  
  // Metadata
  leagues = signal<League[]>([]);
  divisions = signal<Division[]>([]);
  conferences = signal<Conference[]>([]);

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
  displayedTeams = computed(() => {
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

  selectedCount = computed(() => this.selectedTeamIds().size);

  uniqueLeagues = computed(() => {
    const teams = this.teams();
    if (!teams || !Array.isArray(teams)) return [];
    const leagues = new Set(teams.map(t => t.league).filter(Boolean) as string[]);
    return Array.from(leagues).sort();
  });

  uniqueDivisions = computed(() => {
    const teams = this.teams();
    if (!teams || !Array.isArray(teams)) return [];
    const divisions = new Set(teams.map(t => t.division).filter(Boolean) as string[]);
    return Array.from(divisions).sort();
  });

  uniqueConferences = computed(() => {
    const teams = this.teams();
    if (!teams || !Array.isArray(teams)) return [];
    const conferences = new Set(
      teams.map(t => t.conference).filter(Boolean) as string[]
    );
    return Array.from(conferences).sort();
  });


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
  }

  loadTeams(): void {
    this.loading.set(true);
    this.http.get<{ data: Team[]; meta: { total: number } }>(this.apiUrl).subscribe({
      next: (response) => {
        // Backend returns { data: Team[], meta: { total: number } }
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
      coachId: undefined,
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
      coachId: team.coach?.id,
      logo: team.logo || '',
    });
    this.formError.set(null);
    this.clearFile();
    if (team.logo) {
      this.logoPreview.set(team.logo);
    }
    this.showEditModal.set(true);
  }

  async updateTeam(): Promise<void> {
    this.formError.set(null);
    const team = this.selectedTeam();
    if (!team) return;

    this.loading.set(true);

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
        coachId: this.formData().coachId,
        logo: logoUrl || undefined,
      };

      this.http.put<Team>(`${this.apiUrl}/admin/${team.id}`, data).subscribe({
        next: () => {
          this.alerts.open('Team updated successfully', { appearance: 'success' }).subscribe();
          this.showEditModal.set(false);
          this.loadTeams();
        },
        error: (error) => {
          console.error('Error updating team:', error);
          this.formError.set(error.error?.message || 'Failed to update team');
          this.loading.set(false);
        },
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      this.formError.set('Failed to upload logo');
      this.loading.set(false);
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
      // Combine the data
      this.teamDetails.set({
        ...details,
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

    this.loading.set(true);
    this.http.delete(`${this.apiUrl}/admin/${team.id}`).subscribe({
      next: () => {
        this.alerts.open('Team deleted successfully', { appearance: 'success' }).subscribe();
        this.showDeleteModal.set(false);
        this.loadTeams();
      },
      error: (error) => {
        console.error('Error deleting team:', error);
        this.alerts.open(error.error?.message || 'Failed to delete team', { appearance: 'error' }).subscribe();
        this.loading.set(false);
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
    this.loading.set(true);

    const deleteRequests = ids.map(id =>
      this.http.delete(`${this.apiUrl}/admin/${id}`).toPromise()
    );

    Promise.all(deleteRequests)
      .then(() => {
        this.alerts.open(`${ids.length} team(s) deleted successfully`, { appearance: 'success' }).subscribe();
        this.showBulkDeleteModal.set(false);
        this.clearSelection();
        this.loadTeams();
      })
      .catch((error) => {
        console.error('Error deleting teams:', error);
        this.alerts.open('Failed to delete some teams', { appearance: 'error' }).subscribe();
        this.loading.set(false);
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
    // Handle both name formats: direct name or firstName/lastName
    if ('name' in team.coach && team.coach.name) {
      return team.coach.name;
    }
    if ('firstName' in team.coach || 'lastName' in team.coach) {
      const firstName = (team.coach as any).firstName || '';
      const lastName = (team.coach as any).lastName || '';
      return `${firstName} ${lastName}`.trim();
    }
    return '-';
  }
}
