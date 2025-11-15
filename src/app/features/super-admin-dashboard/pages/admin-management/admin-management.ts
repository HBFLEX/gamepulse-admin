import {Component, computed, inject, signal} from '@angular/core';
import {AdminManagementApiService} from '../../../../core/services/admin-management-api-service';
import {AdminApiService} from '../../../../core/services/admin-api.service';
import {AdminUser, CreateAdminDto, UpdateAdminDto} from '../../../../core/models/admin-management.model';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  TuiButton,
  TuiDataList,
  TuiDropdown,
  TuiError, TuiHint,
  TuiIcon,
  TuiLabel,
  TuiLoader,
  TuiTextfield
} from '@taiga-ui/core';
import {TuiAvatar, TuiBadge, TuiSwitch} from '@taiga-ui/kit';
import {TuiCardLarge, TuiHeader} from '@taiga-ui/layout';
import {TuiTable} from '@taiga-ui/addon-table';
import {TuiInputModule, TuiSelectModule} from '@taiga-ui/legacy';

interface RoleOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-admin-management',
  imports: [
    CommonModule,
    FormsModule,
    TuiButton,
    TuiIcon,
    TuiDataList,
    TuiDropdown,
    TuiLabel,
    TuiError,
    TuiLoader,
    TuiTextfield,
    TuiSwitch,
    TuiBadge,
    TuiAvatar,
    TuiCardLarge,
    TuiHeader,
    TuiTable,
    TuiHint,
    TuiInputModule,
    TuiSelectModule,
  ],
  templateUrl: './admin-management.html',
  styleUrl: './admin-management.less',
})
export class AdminManagement {
  private readonly adminApi = inject(AdminManagementApiService);
  private readonly teamsApi = inject(AdminApiService);

  // State signals
  readonly admins = signal<AdminUser[]>([]);
  readonly loading = signal(false);
  readonly totalAdmins = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(20);
  readonly hasMore = signal(false);

  // Filter signals
  readonly searchTerm = signal('');
  readonly roleFilter = signal<string>('all');
  readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');

  // Modal signals
  readonly showCreateModal = signal(false);
  readonly showEditModal = signal(false);
  readonly showDeleteModal = signal(false);
  readonly selectedAdmin = signal<AdminUser | null>(null);

  // Form signals
  readonly createForm = signal<CreateAdminDto>({
    email: '',
    password: '',
    fullName: '',
    roleId: 2,
    teamId: undefined,
  });

  readonly editForm = signal<UpdateAdminDto>({
    fullName: '',
    roleId: undefined,
    teamId: undefined,
    isActive: true,
  });

  // Error signals
  readonly createError = signal<string | null>(null);
  readonly editError = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);

  // Available roles
  readonly roles: RoleOption[] = [
    { id: 1, name: 'Super Admin' },
    { id: 2, name: 'League Admin' },
    { id: 3, name: 'Team Admin' },
    { id: 4, name: 'Content Admin' },
    { id: 5, name: 'Game Admin' },
  ];

  // Teams list
  readonly teams = signal<any[]>([]);

  // Table columns
  readonly columns = ['avatar', 'name', 'email', 'role', 'status', 'lastLogin', 'actions'];

  // Computed filtered admins
  readonly filteredAdmins = computed(() => {
    let filtered = this.admins();

    // Search filter
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(
        (admin) =>
          admin.full_name.toLowerCase().includes(search) ||
          admin.email.toLowerCase().includes(search) ||
          admin.username?.toLowerCase().includes(search)
      );
    }

    // Role filter
    if (this.roleFilter() !== 'all') {
      filtered = filtered.filter((admin) => admin.role.role_name === this.roleFilter());
    }

    // Status filter
    if (this.statusFilter() !== 'all') {
      const isActive = this.statusFilter() === 'active';
      filtered = filtered.filter((admin) => admin.is_active === isActive);
    }

    return filtered;
  });

  ngOnInit(): void {
    this.loadAdmins();
    this.loadTeams();
  }

  loadAdmins(): void {
    this.loading.set(true);

    const roleParam = this.roleFilter() !== 'all' ? this.roleFilter() : undefined;
    const isActiveParam =
      this.statusFilter() !== 'all' ? this.statusFilter() === 'active' : undefined;

    this.adminApi.getAdmins(roleParam, isActiveParam, this.currentPage(), this.pageSize()).subscribe({
      next: (response) => {
        this.admins.set(response.data);
        this.totalAdmins.set(response.meta.total);
        this.hasMore.set(response.meta.hasMore);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading admins:', error);
        this.loading.set(false);
      },
    });
  }

  loadTeams(): void {
    this.teamsApi.getTeams().subscribe({
      next: (teams) => {
        this.teams.set(teams);
      },
      error: (error) => {
        console.error('Error loading teams:', error);
      },
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  onRoleFilterChange(value: string): void {
    this.roleFilter.set(value);
    this.currentPage.set(1);
    this.loadAdmins();
  }

  onStatusFilterChange(value: 'all' | 'active' | 'inactive'): void {
    this.statusFilter.set(value);
    this.currentPage.set(1);
    this.loadAdmins();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadAdmins();
  }

  openCreateModal(): void {
    this.createForm.set({
      email: '',
      password: '',
      fullName: '',
      roleId: 2,
      teamId: undefined,
    });
    this.createError.set(null);
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  onCreateSubmit(): void {
    this.createError.set(null);
    const form = this.createForm();

    if (!form.email || !form.password || !form.fullName) {
      this.createError.set('Please fill in all required fields');
      return;
    }

    this.loading.set(true);

    this.adminApi.createAdmin(form).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.closeCreateModal();
        this.loadAdmins();
      },
      error: (error) => {
        this.loading.set(false);
        this.createError.set(error.error?.message || 'Failed to create admin');
      },
    });
  }

  openEditModal(admin: AdminUser): void {
    this.selectedAdmin.set(admin);
    this.editForm.set({
      fullName: admin.full_name,
      roleId: admin.role.id,
      teamId: admin.team?.id,
      isActive: admin.is_active,
    });
    this.editError.set(null);
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedAdmin.set(null);
  }

  onEditSubmit(): void {
    const admin = this.selectedAdmin();
    if (!admin) return;

    this.editError.set(null);
    this.loading.set(true);

    this.adminApi.updateAdmin(admin.id, this.editForm()).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.closeEditModal();
        this.loadAdmins();
      },
      error: (error) => {
        this.loading.set(false);
        this.editError.set(error.error?.message || 'Failed to update admin');
      },
    });
  }

  openDeleteModal(admin: AdminUser): void {
    this.selectedAdmin.set(admin);
    this.deleteError.set(null);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedAdmin.set(null);
  }

  onDeleteConfirm(): void {
    const admin = this.selectedAdmin();
    if (!admin) return;

    this.deleteError.set(null);
    this.loading.set(true);

    this.adminApi.deleteAdmin(admin.id).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.closeDeleteModal();
        this.loadAdmins();
      },
      error: (error) => {
        this.loading.set(false);
        this.deleteError.set(error.error?.message || 'Failed to delete admin');
      },
    });
  }

  toggleAdminStatus(admin: AdminUser): void {
    this.adminApi.toggleActive(admin.id).subscribe({
      next: (response) => {
        this.loadAdmins();
      },
      error: (error) => {
        console.error('Error toggling admin status:', error);
      },
    });
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getRoleBadgeColor(roleName: string): string {
    const roleColors: Record<string, string> = {
      'Super Admin': '#E45E2C',
      'League Admin': '#3A2634',
      'Team Admin': '#C53A34',
      'Content Admin': '#10b981',
      'Game Admin': '#f59e0b',
    };
    return roleColors[roleName] || '#6b7280';
  }

  protected readonly Math = Math;
}
