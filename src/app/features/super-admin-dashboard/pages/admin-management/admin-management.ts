import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiHint, TuiIcon, TuiLabel, TuiLoader, TuiTextfield, TuiAlertService } from '@taiga-ui/core';
import { TuiAvatar, TuiSwitch } from '@taiga-ui/kit';
import { TuiCardLarge } from '@taiga-ui/layout';
import { TuiTable } from '@taiga-ui/addon-table';
import { AdminManagementApiService } from '../../../../core/services/admin-management-api-service';
import { AdminApiService } from '../../../../core/services/admin-api.service';
import { AdminUser, CreateAdminDto, UpdateAdminDto } from '../../../../core/models/admin-management.model';
import { AuditLogsTabComponent } from './tabs/audit-logs-tab.component';
import { AuditStatsTabComponent } from './tabs/audit-stats-tab.component';
import { ConnectionStatsTabComponent } from './tabs/connection-stats-tab.component';

interface RoleOption {
  id: number;
  name: string;
}

interface Team {
  id: number;
  name: string;
  city?: string;
}

@Component({
  selector: 'app-admin-management',
  imports: [
    CommonModule,
    FormsModule,
    TuiButton,
    TuiIcon,
    TuiLabel,
    TuiLoader,
    TuiTextfield,
    TuiSwitch,
    TuiAvatar,
    TuiCardLarge,
    TuiTable,
    TuiHint,
    AuditLogsTabComponent,
    AuditStatsTabComponent,
    ConnectionStatsTabComponent,
  ],
  templateUrl: './admin-management.html',
  styleUrl: './admin-management.less',
})
export class AdminManagement implements OnInit {
  // Active tab
  readonly activeTab = signal<'admins' | 'audit-logs' | 'audit-stats' | 'connection-stats'>('admins');


  private readonly adminApi = inject(AdminManagementApiService);
  private readonly teamsApi = inject(AdminApiService);
  private readonly alerts = inject(TuiAlertService);

  // State
  readonly admins = signal<AdminUser[]>([]);
  readonly loading = signal(false);
  readonly totalAdmins = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(20);
  readonly hasMore = signal(false);

  // Filters
  readonly searchTerm = signal('');
  readonly roleFilter = signal<string>('all');
  readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  readonly teamFilter = signal<string>('all');

  // Sorting
  readonly sortColumn = signal<string>('');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  // Bulk Actions
  readonly selectedAdminIds = signal<Set<string>>(new Set());
  readonly showBulkDeleteModal = signal(false);
  readonly showBulkRoleUpdateModal = signal(false);
  readonly bulkRoleId = signal<number | undefined>(undefined);
  readonly bulkTeamId = signal<number | undefined>(undefined);
  readonly bulkActionLoading = signal(false);

  // Modals
  readonly showCreateModal = signal(false);
  readonly showEditModal = signal(false);
  readonly showDeleteModal = signal(false);
  readonly selectedAdmin = signal<AdminUser | null>(null);

  // Forms
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

  // Errors
  readonly createError = signal<string | null>(null);
  readonly editError = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);

  // Data
  readonly roles = signal<RoleOption[]>([
    { id: 1, name: 'Super Admin' },
    { id: 2, name: 'League Admin' },
    { id: 3, name: 'Team Admin' },
    { id: 4, name: 'Content Admin' },
    { id: 5, name: 'Game Admin' },
  ]);

  readonly teams = signal<Team[]>([]);
  readonly columns = ['select', 'avatar', 'name', 'email', 'role', 'status', 'team', 'created', 'lastLogin', 'actions'];

  // Client-side filtered list for display
  readonly displayedAdmins = computed(() => {
    let filtered = this.admins();

    // Filter by team if team_admin is selected and a specific team is chosen
    const teamFilterValue = this.teamFilter();
    if (this.roleFilter() === 'team_admin' && teamFilterValue !== 'all') {
      filtered = filtered.filter(admin => admin.team?.id === Number(teamFilterValue));
    }

    // Filter by search term
    const search = this.searchTerm().toLowerCase().trim();
    if (search) {
      filtered = filtered.filter(
        (admin) =>
          admin.fullName?.toLowerCase().includes(search) ||
          admin.email?.toLowerCase().includes(search) ||
          admin.username?.toLowerCase().includes(search)
      );
    }

    // Sort
    const column = this.sortColumn();
    const direction = this.sortDirection();
    
    if (column) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (column) {
          case 'name':
            aValue = a.fullName?.toLowerCase() || '';
            bValue = b.fullName?.toLowerCase() || '';
            break;
          case 'email':
            aValue = a.email?.toLowerCase() || '';
            bValue = b.email?.toLowerCase() || '';
            break;
          case 'role':
            aValue = a.role?.name?.toLowerCase() || '';
            bValue = b.role?.name?.toLowerCase() || '';
            break;
          case 'status':
            aValue = a.isActive ? 1 : 0;
            bValue = b.isActive ? 1 : 0;
            break;
          case 'lastLogin':
            aValue = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
            bValue = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
            break;
          case 'team':
            aValue = a.team?.name?.toLowerCase() || '';
            bValue = b.team?.name?.toLowerCase() || '';
            break;
          case 'created':
            aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  });

  readonly totalPages = computed(() => Math.ceil(this.totalAdmins() / this.pageSize()));

  readonly shouldShowTeamDropdownInEdit = computed(() => {
    return this.editForm().roleId === 3 && this.teams().length > 0;
  });

  readonly selectedCount = computed(() => this.selectedAdminIds().size);
  
  readonly isAllSelected = computed(() => {
    const displayed = this.displayedAdmins();
    return displayed.length > 0 && displayed.every(admin => this.selectedAdminIds().has(admin.id));
  });

  readonly isSomeSelected = computed(() => {
    return this.selectedCount() > 0 && !this.isAllSelected();
  });

  readonly shouldShowTeamDropdownInBulk = computed(() => {
    return this.bulkRoleId() === 3 && this.teams().length > 0;
  });


  ngOnInit(): void {
    this.loadAdmins();
    this.loadTeams();
  }

  switchTab(tab: 'admins' | 'audit-logs' | 'audit-stats' | 'connection-stats'): void {
    this.activeTab.set(tab);
  }

  loadAdmins(): void {
    this.loading.set(true);
    const roleParam = this.roleFilter() !== 'all' ? this.roleFilter() : undefined;
    const isActiveParam = this.statusFilter() !== 'all' ? this.statusFilter() === 'active' : undefined;

    this.adminApi.getAdmins(roleParam, isActiveParam, this.currentPage(), this.pageSize()).subscribe({
      next: (response) => {
        this.admins.set(response.data || []);
        this.totalAdmins.set(response.meta?.total || 0);
        this.hasMore.set(response.meta?.hasMore || false);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading admins:', error);
        this.admins.set([]);
        this.loading.set(false);
      },
    });
  }

  loadAdminsInBackground(): void {
    // Load admins without showing loading indicator
    const roleParam = this.roleFilter() !== 'all' ? this.roleFilter() : undefined;
    const isActiveParam = this.statusFilter() !== 'all' ? this.statusFilter() === 'active' : undefined;

    this.adminApi.getAdmins(roleParam, isActiveParam, this.currentPage(), this.pageSize()).subscribe({
      next: (response) => {
        this.admins.set(response.data || []);
        this.totalAdmins.set(response.meta?.total || 0);
        this.hasMore.set(response.meta?.hasMore || false);
      },
      error: (error) => {
        console.error('Error loading admins in background:', error);
      },
    });
  }

  loadTeams(): void {
    this.teamsApi.getTeams().subscribe({
      next: (teams) => {
        this.teams.set(teams || []);
        console.log('TEAMS DATA', this.teams())
      },
      error: (error) => console.error('Error loading teams:', error),
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  onRoleFilterChange(value: string): void {
    this.roleFilter.set(value);
    // Reset team filter when role changes
    this.teamFilter.set('all');
    this.currentPage.set(1);
    this.loadAdmins();
  }

  onFullNameChange(newFullName: string): void {
    this.editForm.set({
      ...this.editForm(),
      fullName: newFullName,
    });
  }

  onRoleChange(newRoleId: number | string): void {
    const roleId = typeof newRoleId === 'string' ? +newRoleId : newRoleId;
    this.editForm.set({
      ...this.editForm(), // Spread previous state
      roleId: roleId,
      teamId: undefined, // Reset team if role is not Team Admin
    });
  }

  onTeamChange(newTeamId: number | string | undefined): void {
    const teamId = newTeamId ? (typeof newTeamId === 'string' ? +newTeamId : newTeamId) : undefined;
    this.editForm.set({
      ...this.editForm(),
      teamId: teamId,
    });
  }

  onActiveChange(isActive: boolean | string): void {
    const active = typeof isActive === 'string' ? isActive === 'true' : isActive;
    this.editForm.set({
      ...this.editForm(),
      isActive: active,
    });
  }

  onStatusFilterChange(value: 'all' | 'active' | 'inactive'): void {
    this.statusFilter.set(value);
    this.currentPage.set(1);
    this.loadAdmins();
  }

  onTeamFilterChange(value: string): void {
    this.teamFilter.set(value);
    this.currentPage.set(1);
    this.loadAdmins();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadAdmins();
  }

  onSort(column: string): void {
    // If clicking the same column, toggle direction
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      // Deselect all
      this.selectedAdminIds.set(new Set());
    } else {
      // Select all displayed admins
      const allIds = new Set(this.displayedAdmins().map(admin => admin.id));
      this.selectedAdminIds.set(allIds);
    }
  }

  toggleSelectAdmin(adminId: string): void {
    const selected = new Set(this.selectedAdminIds());
    if (selected.has(adminId)) {
      selected.delete(adminId);
    } else {
      selected.add(adminId);
    }
    this.selectedAdminIds.set(selected);
  }

  isAdminSelected(adminId: string): boolean {
    return this.selectedAdminIds().has(adminId);
  }

  openBulkDeleteModal(): void {
    if (this.selectedCount() === 0) return;
    this.showBulkDeleteModal.set(true);
  }

  closeBulkDeleteModal(): void {
    this.showBulkDeleteModal.set(false);
  }

  openBulkRoleUpdateModal(): void {
    if (this.selectedCount() === 0) return;
    this.bulkRoleId.set(undefined);
    this.bulkTeamId.set(undefined);
    this.showBulkRoleUpdateModal.set(true);
  }

  closeBulkRoleUpdateModal(): void {
    this.showBulkRoleUpdateModal.set(false);
  }

  onBulkDeleteConfirm(): void {
    const idsToDelete = Array.from(this.selectedAdminIds());
    if (idsToDelete.length === 0) return;

    this.bulkActionLoading.set(true);

    // Optimistically remove from UI
    const updatedAdmins = this.admins().filter(admin => !idsToDelete.includes(admin.id));
    this.admins.set(updatedAdmins);
    this.totalAdmins.set(this.totalAdmins() - idsToDelete.length);
    this.selectedAdminIds.set(new Set());
    this.closeBulkDeleteModal();

    // Delete on server
    const deleteRequests = idsToDelete.map(id => this.adminApi.deleteAdmin(id));
    
    // Use forkJoin to wait for all deletes (you'll need to import from rxjs)
    let completed = 0;
    let failed = 0;
    
    deleteRequests.forEach(request => {
      request.subscribe({
        next: () => {
          completed++;
          if (completed + failed === idsToDelete.length) {
            this.bulkActionLoading.set(false);
            this.loadAdminsInBackground();
            if (failed === 0) {
              this.alerts
                .open(`Successfully deleted ${completed} admin(s)`, {
                  appearance: 'success',
                  label: 'Success',
                  autoClose: 3000,
                })
                .subscribe();
            } else {
              this.alerts
                .open(`Deleted ${completed} admin(s), failed to delete ${failed}`, {
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
          if (completed + failed === idsToDelete.length) {
            this.bulkActionLoading.set(false);
            if (failed === idsToDelete.length) {
              this.loadAdmins();
              this.alerts
                .open('Failed to delete admins', {
                  appearance: 'error',
                  label: 'Delete Failed',
                  autoClose: 5000,
                })
                .subscribe();
            } else {
              this.loadAdminsInBackground();
              this.alerts
                .open(`Deleted ${completed} admin(s), failed to delete ${failed}`, {
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

  onBulkRoleUpdateConfirm(): void {
    const idsToUpdate = Array.from(this.selectedAdminIds());
    const roleId = this.bulkRoleId();
    const teamId = this.bulkTeamId();
    
    if (idsToUpdate.length === 0 || !roleId) return;

    this.bulkActionLoading.set(true);

    // Optimistically update UI
    const updatedAdmins = this.admins().map(admin => {
      if (idsToUpdate.includes(admin.id)) {
        const selectedRole = this.roles().find(r => r.id === roleId);
        const selectedTeam = teamId ? this.teams().find(t => t.id === teamId) : undefined;
        return {
          ...admin,
          role: selectedRole ? {
            id: selectedRole.id,
            name: this.getRoleNameFromId(selectedRole.id),
            permissions: admin.role?.permissions || []
          } : admin.role,
          team: selectedTeam ? { 
            id: selectedTeam.id, 
            name: selectedTeam.name, 
            city: selectedTeam.city || '' 
          } : (roleId === 3 ? admin.team : undefined)
        };
      }
      return admin;
    });
    this.admins.set(updatedAdmins);
    this.selectedAdminIds.set(new Set());
    this.closeBulkRoleUpdateModal();

    // Update on server
    let completed = 0;
    let failed = 0;
    
    const updateDto: any = { roleId };
    if (roleId === 3 && teamId) {
      updateDto.teamId = teamId;
    }
    
    idsToUpdate.forEach(id => {
      this.adminApi.updateAdmin(id, updateDto).subscribe({
        next: () => {
          completed++;
          if (completed + failed === idsToUpdate.length) {
            this.bulkActionLoading.set(false);
            this.loadAdminsInBackground();
            if (failed === 0) {
              this.alerts
                .open(`Successfully updated ${completed} admin(s)`, {
                  appearance: 'success',
                  label: 'Success',
                  autoClose: 3000,
                })
                .subscribe();
            } else {
              this.alerts
                .open(`Updated ${completed} admin(s), failed to update ${failed}`, {
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
          if (completed + failed === idsToUpdate.length) {
            this.bulkActionLoading.set(false);
            if (failed === idsToUpdate.length) {
              this.loadAdmins();
              this.alerts
                .open('Failed to update admin roles', {
                  appearance: 'error',
                  label: 'Update Failed',
                  autoClose: 5000,
                })
                .subscribe();
            } else {
              this.loadAdminsInBackground();
              this.alerts
                .open(`Updated ${completed} admin(s), failed to update ${failed}`, {
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
      next: () => {
        this.loading.set(false);
        this.closeCreateModal();
        this.loadAdmins();
        // Show success toast
        this.alerts
          .open('Admin created successfully', {
            appearance: 'success',
            label: 'Success',
            autoClose: 3000,
          })
          .subscribe();
      },
      error: (error) => {
        this.loading.set(false);
        this.createError.set(error.error?.message || 'Failed to create admin');
      },
    });
  }

  openEditModal(admin: AdminUser): void {
    this.selectedAdmin.set(admin);

    console.log('Opening edit modal for admin:', {
      fullName: admin.fullName,
      role: admin.role,
      team: admin.team,
      isActive: admin.isActive
    });

    this.editForm.set({
      fullName: admin.fullName,
      roleId: admin.role?.id,
      teamId: admin.team?.id || undefined,
      isActive: admin.isActive,
    });

    console.log('Edit form set to:', this.editForm());
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
    const form = this.editForm();

    console.log('Submitting edit with data:', form);

    // Optimistically update the UI immediately
    const adminIndex = this.admins().findIndex(a => a.id === admin.id);
    if (adminIndex !== -1) {
      const updatedAdmins = [...this.admins()];
      const selectedRole = this.roles().find(r => r.id === form.roleId);
      const selectedTeam = this.teams().find(t => t.id === form.teamId);
      
      updatedAdmins[adminIndex] = {
        ...updatedAdmins[adminIndex],
        fullName: form.fullName || updatedAdmins[adminIndex].fullName,
        isActive: form.isActive !== undefined ? form.isActive : updatedAdmins[adminIndex].isActive,
        role: selectedRole ? {
          id: selectedRole.id,
          name: this.getRoleNameFromId(selectedRole.id),
          permissions: updatedAdmins[adminIndex].role?.permissions || []
        } : updatedAdmins[adminIndex].role,
        team: form.teamId ? (selectedTeam ? { id: selectedTeam.id, name: selectedTeam.name, city: updatedAdmins[adminIndex].team?.city || '' } : updatedAdmins[adminIndex].team) : undefined
      };
      this.admins.set(updatedAdmins);
    }

    // Close modal immediately for better UX
    this.closeEditModal();

    // Then update on the server in the background
    this.adminApi.updateAdmin(admin.id, form).subscribe({
      next: (response) => {
        console.log('Update response:', response);
        // Optionally reload to sync with server (silent background refresh)
        this.loadAdminsInBackground();
        // Show success toast
        this.alerts
          .open('Admin updated successfully', {
            appearance: 'success',
            label: 'Success',
            autoClose: 3000,
          })
          .subscribe();
      },
      error: (error) => {
        console.error('Update error:', error);
        // Revert the optimistic update on error and show the error
        this.loadAdmins();
        // Show error toast
        this.alerts
          .open('Failed to update admin: ' + (error.error?.message || 'Unknown error'), {
            appearance: 'error',
            label: 'Update Failed',
            autoClose: 5000,
          })
          .subscribe();
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

    // Optimistically remove from UI immediately
    const updatedAdmins = this.admins().filter(a => a.id !== admin.id);
    this.admins.set(updatedAdmins);
    this.totalAdmins.set(this.totalAdmins() - 1);

    // Close modal immediately for better UX
    this.closeDeleteModal();

    // Then delete on the server in the background
    this.adminApi.deleteAdmin(admin.id).subscribe({
      next: () => {
        console.log('Admin deleted successfully');
        // Optionally reload to sync with server
        this.loadAdminsInBackground();
        // Show success toast
        this.alerts
          .open('Admin deleted successfully', {
            appearance: 'success',
            label: 'Success',
            autoClose: 3000,
          })
          .subscribe();
      },
      error: (error) => {
        console.error('Delete error:', error);
        // Revert the optimistic update on error
        this.loadAdmins();
        // Show error toast
        this.alerts
          .open('Failed to delete admin: ' + (error.error?.message || 'Unknown error'), {
            appearance: 'error',
            label: 'Delete Failed',
            autoClose: 5000,
          })
          .subscribe();
      },
    });
  }

  toggleAdminStatus(admin: AdminUser): void {
    // Optimistically update the UI
    const adminIndex = this.admins().findIndex(a => a.id === admin.id);
    if (adminIndex !== -1) {
      const updatedAdmins = [...this.admins()];
      updatedAdmins[adminIndex] = {
        ...updatedAdmins[adminIndex],
        isActive: !updatedAdmins[adminIndex].isActive
      };
      this.admins.set(updatedAdmins);
    }

    // Then update on the server in the background
    this.adminApi.toggleActive(admin.id).subscribe({
      next: () => {
        console.log('Admin status toggled successfully');
        // Optionally reload to sync with server (silent background refresh)
        this.loadAdminsInBackground();
      },
      error: (error) => {
        console.error('Error toggling admin status:', error);
        // Revert the optimistic update on error
        this.loadAdmins();
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
    if (!dateString) return 'Never';
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
      'super_admin': '#E45E2C',
      'league_admin': '#3A2634',
      'team_admin': '#C53A34',
      'content_admin': '#10b981',
      'game_admin': '#f59e0b',
    };
    return roleColors[roleName] || '#6b7280';
  }

  getRoleDisplayName(roleName: string): string {
    const roleNames: Record<string, string> = {
      'super_admin': 'Super Admin',
      'league_admin': 'League Admin',
      'team_admin': 'Team Admin',
      'content_admin': 'Content Admin',
      'game_admin': 'Game Admin',
    };
    return roleNames[roleName] || roleName;
  }

  getRoleNameFromId(roleId: number): string {
    const roleMap: Record<number, string> = {
      1: 'super_admin',
      2: 'league_admin',
      3: 'team_admin',
      4: 'content_admin',
      5: 'game_admin',
    };
    return roleMap[roleId] || 'unknown';
  }

  protected readonly Math = Math;
}
