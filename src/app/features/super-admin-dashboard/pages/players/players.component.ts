import { Component, OnInit, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TuiButton, TuiIcon, TuiLoader, TuiAlertService, TuiTextfield, TuiLabel, TuiTextfieldComponent } from '@taiga-ui/core';
import { TuiInputModule, TuiInputNumberModule, TuiSelectModule } from '@taiga-ui/legacy';
import { environment } from '../../../../../environments/environment';
import { PlayersApiService, Player, CreatePlayerDto, UpdatePlayerDto, Position } from '../../../../core/services/players-api.service';

interface Team {
  id: number;
  name: string;
  city?: string;
}

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TuiButton,
    TuiIcon,
    TuiLoader,
    TuiTextfield,
    TuiTextfieldComponent,
    TuiLabel,
    TuiInputModule,
    TuiInputNumberModule,
    TuiSelectModule,
  ],
  templateUrl: './players.component.html',
  styleUrl: './players.component.less'
})
export class PlayersComponent implements OnInit {
  private http = inject(HttpClient);
  private alerts = inject(TuiAlertService);
  private playersApi = inject(PlayersApiService);

  private apiUrl = `${environment.apiUrl}/players`;

  // State
  players = signal<Player[]>([]);
  teams = signal<Team[]>([]);
  positions = signal<Position[]>([]);
  loading = signal(false);
  selectedPlayerIds = signal(new Set<number>());

  // Search & Filters
  searchQuery = signal('');
  filterTeam = signal('');
  filterPosition = signal('');

  // Sorting
  sortColumn = signal<string>('lastName');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(20);
  totalPlayers = signal(0);

  // Modal state
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  showTransferModal = signal(false);
  selectedPlayer = signal<Player | null>(null);

  // Form data
  playerForm = signal<Partial<CreatePlayerDto>>({});
  transferTeamId = signal<number | null>(null);

  // Computed
  filteredPlayers = computed(() => {
    const players = this.players();
    if (!players || !Array.isArray(players) || players.length === 0) return [];

    let filtered = [...players];

    // Search
    const query = this.searchQuery();
    if (query && query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(player =>
        (player.firstName?.toLowerCase() || '').includes(lowerQuery) ||
        (player.lastName?.toLowerCase() || '').includes(lowerQuery) ||
        (player.fullName?.toLowerCase() || '').includes(lowerQuery) ||
        (player.team?.name?.toLowerCase() || '').includes(lowerQuery) ||
        (player.position?.toLowerCase() || '').includes(lowerQuery) ||
        (player.nationality?.toLowerCase() || '').includes(lowerQuery)
      );
    }

    // Filter by team
    const team = this.filterTeam();
    if (team) {
      filtered = filtered.filter(player => player.team?.name === team);
    }

    // Filter by position
    const position = this.filterPosition();
    if (position) {
      filtered = filtered.filter(player => player.position === position);
    }

    // Sort
    const col = this.sortColumn();
    const dir = this.sortDirection();
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (col === 'team') {
        aVal = a.team?.name || '';
        bVal = b.team?.name || '';
      } else if (col === 'age') {
        aVal = this.calculateAge(a.birthDate);
        bVal = this.calculateAge(b.birthDate);
      } else {
        aVal = a[col as keyof Player];
        bVal = b[col as keyof Player];
      }

      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      if (aVal < bVal) return dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  });

  displayedPlayers = computed(() => {
    const filtered = this.filteredPlayers();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    const end = start + size;
    return filtered.slice(start, end);
  });

  totalPages = computed(() => Math.ceil(this.filteredPlayers().length / this.pageSize()));

  selectedCount = computed(() => this.selectedPlayerIds().size);

  uniqueTeams = computed(() => {
    const players = this.players();
    const teamNames = new Set<string>();
    players.forEach(player => {
      if (player.team?.name) teamNames.add(player.team.name);
    });
    return Array.from(teamNames).sort();
  });

  uniquePositions = computed(() => {
    const players = this.players();
    const positions = new Set<string>();
    players.forEach(player => {
      if (player.position) positions.add(player.position);
    });
    return Array.from(positions).sort();
  });

  constructor() {
    // Reset to page 1 when filters change
    effect(() => {
      this.searchQuery();
      this.filterTeam();
      this.filterPosition();
      this.currentPage.set(1);
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.loadPlayers();
    this.loadTeams();
    this.loadPositions();
  }

  loadPlayers(): void {
    this.loading.set(true);
    this.http.get<{ data: Player[]; meta: { total: number } }>(this.apiUrl).subscribe({
      next: (response) => {
        const players = response?.data || [];
        this.players.set(players);
        this.totalPlayers.set(response?.meta?.total || players.length);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading players:', error);
        this.alerts.open('Failed to load players', { appearance: 'error' }).subscribe();
        this.loading.set(false);
      },
    });
  }

  loadTeams(): void {
    this.http.get<{ data: any[] }>(`${environment.apiUrl}/teams`).subscribe({
      next: (response: any) => {
        const teams = response?.data || [];
        this.teams.set(teams.map((t: any) => ({ id: t.id, name: t.name, city: t.city })));
      },
      error: (error: any) => {
        console.error('Error loading teams:', error);
      },
    });
  }

  loadPositions(): void {
    this.playersApi.getPositions().subscribe({
      next: (response) => {
        this.positions.set(response?.data || []);
      },
      error: (error) => {
        console.error('Error loading positions:', error);
      },
    });
  }

  // Selection
  toggleSelection(playerId: number): void {
    const selected = new Set(this.selectedPlayerIds());
    if (selected.has(playerId)) {
      selected.delete(playerId);
    } else {
      selected.add(playerId);
    }
    this.selectedPlayerIds.set(selected);
  }

  isSelected(playerId: number): boolean {
    return this.selectedPlayerIds().has(playerId);
  }

  toggleSelectAll(): void {
    const displayed = this.displayedPlayers();
    if (displayed.length === 0) return;

    const allSelected = displayed.every(player => this.selectedPlayerIds().has(player.id));

    if (allSelected) {
      this.selectedPlayerIds.set(new Set());
    } else {
      this.selectedPlayerIds.set(new Set(displayed.map(player => player.id)));
    }
  }

  areAllSelected(): boolean {
    const displayed = this.displayedPlayers();
    if (displayed.length === 0) return false;
    return displayed.every(player => this.selectedPlayerIds().has(player.id));
  }

  clearSelection(): void {
    this.selectedPlayerIds.set(new Set());
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

  // CRUD Operations
  openCreateModal(): void {
    this.playerForm.set({
      number: 0,
      heightCm: 0,
      weightKg: 0,
    });
    this.showCreateModal.set(true);
  }

  openEditModal(player: Player): void {
    this.selectedPlayer.set(player);
    const position = this.positions().find(p => p.player_position_name === player.position);
    this.playerForm.set({
      teamId: player.team?.id,
      firstName: player.firstName,
      lastName: player.lastName,
      positionId: position?.id || undefined,
      heightCm: player.height,
      weightKg: player.weight,
      birthDate: player.birthDate,
      nationality: player.nationality,
      city: player.city,
      number: player.number,
    });
    this.showEditModal.set(true);
  }

  openDeleteModal(player: Player): void {
    this.selectedPlayer.set(player);
    this.showDeleteModal.set(true);
  }

  openTransferModal(player: Player): void {
    this.selectedPlayer.set(player);
    this.transferTeamId.set(null);
    this.showTransferModal.set(true);
  }

  closeModals(): void {
    this.showCreateModal.set(false);
    this.showEditModal.set(false);
    this.showDeleteModal.set(false);
    this.showTransferModal.set(false);
    this.selectedPlayer.set(null);
    this.playerForm.set({});
    this.transferTeamId.set(null);
  }

  createPlayer(): void {
    const form = this.playerForm();
    if (!this.validatePlayerForm(form)) {
      this.alerts.open('Please fill all required fields', { appearance: 'error' }).subscribe();
      return;
    }

    this.loading.set(true);
    this.playersApi.createPlayer(form as CreatePlayerDto).subscribe({
      next: () => {
        this.alerts.open('Player created successfully', { appearance: 'success' }).subscribe();
        this.loadPlayers();
        this.closeModals();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error creating player:', error);
        this.alerts.open('Failed to create player', { appearance: 'error' }).subscribe();
        this.loading.set(false);
      },
    });
  }

  updatePlayer(): void {
    const player = this.selectedPlayer();
    if (!player) return;

    const form = this.playerForm();
    this.loading.set(true);
    this.playersApi.updatePlayer(player.id, form as UpdatePlayerDto).subscribe({
      next: () => {
        this.alerts.open('Player updated successfully', { appearance: 'success' }).subscribe();
        this.loadPlayers();
        this.closeModals();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error updating player:', error);
        this.alerts.open('Failed to update player', { appearance: 'error' }).subscribe();
        this.loading.set(false);
      },
    });
  }

  deletePlayer(): void {
    const player = this.selectedPlayer();
    if (!player) return;

    this.loading.set(true);
    this.playersApi.deletePlayer(player.id).subscribe({
      next: () => {
        this.alerts.open('Player deleted successfully', { appearance: 'success' }).subscribe();
        this.loadPlayers();
        this.closeModals();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error deleting player:', error);
        this.alerts.open('Failed to delete player', { appearance: 'error' }).subscribe();
        this.loading.set(false);
      },
    });
  }

  transferPlayer(): void {
    const player = this.selectedPlayer();
    const teamId = this.transferTeamId();
    if (!player || !teamId) return;

    this.loading.set(true);
    this.playersApi.transferPlayer(player.id, { teamId }).subscribe({
      next: () => {
        this.alerts.open('Player transferred successfully', { appearance: 'success' }).subscribe();
        this.loadPlayers();
        this.closeModals();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error transferring player:', error);
        this.alerts.open('Failed to transfer player', { appearance: 'error' }).subscribe();
        this.loading.set(false);
      },
    });
  }

  bulkDelete(): void {
    const selected = Array.from(this.selectedPlayerIds());
    if (selected.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selected.length} player(s)?`)) return;

    this.loading.set(true);
    let completed = 0;
    let errors = 0;

    selected.forEach(id => {
      this.playersApi.deletePlayer(id).subscribe({
        next: () => {
          completed++;
          if (completed + errors === selected.length) {
            this.finalizeBulkDelete(completed, errors);
          }
        },
        error: () => {
          errors++;
          if (completed + errors === selected.length) {
            this.finalizeBulkDelete(completed, errors);
          }
        },
      });
    });
  }

  private finalizeBulkDelete(completed: number, errors: number): void {
    this.loadPlayers();
    this.clearSelection();
    this.loading.set(false);
    if (errors > 0) {
      this.alerts.open(`Deleted ${completed} player(s), ${errors} failed`, { appearance: 'warning' }).subscribe();
    } else {
      this.alerts.open(`Successfully deleted ${completed} player(s)`, { appearance: 'success' }).subscribe();
    }
  }

  private validatePlayerForm(form: Partial<CreatePlayerDto>): boolean {
    return !!(
      form.teamId &&
      form.firstName &&
      form.lastName &&
      form.positionId &&
      form.heightCm &&
      form.weightKg &&
      form.birthDate &&
      form.nationality &&
      form.city &&
      form.number
    );
  }

  // Form field update helpers
  updateFormField(field: string, value: any): void {
    this.playerForm.set({ ...this.playerForm(), [field]: value });
  }

  protected readonly Math = Math;
}
