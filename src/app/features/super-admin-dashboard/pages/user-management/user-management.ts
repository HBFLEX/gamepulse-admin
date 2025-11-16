import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiIcon, TuiTextfield, TuiLoader, TuiLabel, TuiHint, TuiAlertService } from '@taiga-ui/core';
import { TuiAvatar, TuiSwitch } from '@taiga-ui/kit';
import { TuiCardLarge } from '@taiga-ui/layout';
import { TuiTable } from '@taiga-ui/addon-table';
import { UserManagementApiService } from '../../../../core/services/user-management-api.service';
import { AdminApiService } from '../../../../core/services/admin-api.service';
import { User, CreateUserDto, UpdateUserDto } from '../../../../core/models/user-management.model';


interface Team {
  id: number;
  name: string;
  city?: string;
}

@Component({
  selector: 'app-user-management',
  imports: [
    CommonModule,
    FormsModule,
    TuiButton,
    TuiIcon,
    TuiLabel,
    TuiTextfield,
    TuiLoader,
    TuiAvatar,
    TuiSwitch,
    TuiHint,
    TuiCardLarge,
    TuiTable,
  ],
  templateUrl: './user-management.html',
  styleUrl: './user-management.less',
})
export class UserManagement implements OnInit {
  private readonly userApi = inject(UserManagementApiService);
  private readonly teamsApi = inject(AdminApiService);
  private readonly alerts = inject(TuiAlertService);

  // State
  readonly users = signal<User[]>([]);
  readonly loading = signal(false);
  readonly totalUsers = signal(0);
  readonly currentPage = signal(1);
  readonly hasMore = signal(false);

  // Filters
  readonly searchTerm = signal('');
  readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  readonly verificationFilter = signal<'all' | 'verified' | 'unverified'>('all');
  readonly teamFilter = signal<string>('all');

  // Sorting
  readonly sortColumn = signal<string>('');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  // Bulk Actions
  readonly selectedUserIds = signal<Set<string>>(new Set());
  readonly showBulkDeleteModal = signal(false);
  readonly showBulkStatusUpdateModal = signal(false);
  readonly bulkStatusAction = signal<'activate' | 'deactivate'>('activate');
  readonly bulkActionLoading = signal(false);

  // Modals
  readonly showCreateModal = signal(false);
  readonly showEditModal = signal(false);
  readonly showDeleteModal = signal(false);
  readonly selectedUser = signal<User | null>(null);

  // Errors
  readonly createError = signal<string | null>(null);
  readonly editError = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);

  // Data
  readonly teams = signal<Team[]>([]);

  // Forms
  readonly createForm = signal<CreateUserDto>({
    fullName: '',
    username: '',
    email: '',
    password: '',
    favoriteTeamId: undefined,
  });

  readonly editForm = signal<UpdateUserDto>({
    fullName: '',
    username: '',
    avatar_url: '',
    bio: '',
    favoriteTeamId: undefined,
    isActive: true,
    notifications_enabled: true,
  });

  // Table columns
  readonly columns = ['select', 'avatar', 'name', 'email', 'status', 'verification', 'favoriteTeam', 'created', 'lastLogin', 'actions'];

  // Client-side filtered and sorted list for display
  readonly displayedUsers = computed(() => {
    let filtered = this.users();

    // Filter by status
    const statusFilter = this.statusFilter();
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(user => user.isActive === isActive);
    }

    // Filter by verification
    const verificationFilter = this.verificationFilter();
    if (verificationFilter !== 'all') {
      const isVerified = verificationFilter === 'verified';
      filtered = filtered.filter(user => user.isVerified === isVerified);
    }

    // Filter by favorite team
    const teamFilterValue = this.teamFilter();
    if (teamFilterValue !== 'all') {
      filtered = filtered.filter(user => user.profile?.favorite_team_id === Number(teamFilterValue));
    }

    // Filter by search term
    const search = this.searchTerm().toLowerCase().trim();
    if (search) {
      filtered = filtered.filter(
        (user) =>
          user.fullName?.toLowerCase().includes(search) ||
          user.email?.toLowerCase().includes(search) ||
          user.username?.toLowerCase().includes(search)
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
          case 'status':
            aValue = a.isActive ? 1 : 0;
            bValue = b.isActive ? 1 : 0;
            break;
          case 'verification':
            aValue = a.isVerified ? 1 : 0;
            bValue = b.isVerified ? 1 : 0;
            break;
          case 'lastLogin':
            aValue = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
            bValue = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
            break;
          case 'favoriteTeam':
            aValue = a.profile?.favorite_team?.name?.toLowerCase() || '';
            bValue = b.profile?.favorite_team?.name?.toLowerCase() || '';
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

  readonly selectedCount = computed(() => this.selectedUserIds().size);

  ngOnInit(): void {
    this.loadUsers();
    this.loadTeams();
  }

  loadUsers(): void {
    this.loading.set(true);
    const isActiveParam = this.statusFilter() !== 'all' ? this.statusFilter() === 'active' : undefined;
    const isVerifiedParam = this.verificationFilter() !== 'all' ? this.verificationFilter() === 'verified' : undefined;

    this.userApi.getUsers(this.searchTerm(), isActiveParam, isVerifiedParam, this.currentPage(), 20).subscribe({
      next: (response) => {
        this.users.set(response.data || []);
        this.totalUsers.set(response.meta?.total || 0);
        this.hasMore.set(response.meta?.hasMore || false);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.users.set([]);
        this.loading.set(false);
      },
    });
  }

  loadUsersInBackground(): void {
    const isActiveParam = this.statusFilter() !== 'all' ? this.statusFilter() === 'active' : undefined;
    const isVerifiedParam = this.verificationFilter() !== 'all' ? this.verificationFilter() === 'verified' : undefined;

    this.userApi.getUsers(this.searchTerm(), isActiveParam, isVerifiedParam, this.currentPage(), 20).subscribe({
      next: (response) => {
        this.users.set(response.data || []);
        this.totalUsers.set(response.meta?.total || 0);
        this.hasMore.set(response.meta?.hasMore || false);
      },
      error: (error) => {
        console.error('Error loading users in background:', error);
      },
    });
  }

  loadTeams(): void {
    this.teamsApi.getTeams().subscribe({
      next: (teams) => {
        this.teams.set(teams || []);
      },
      error: (error) => console.error('Error loading teams:', error),
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  onStatusFilterChange(value: 'all' | 'active' | 'inactive'): void {
    this.statusFilter.set(value);
    this.currentPage.set(1);
    this.loadUsers();
  }

  onVerificationFilterChange(value: 'all' | 'verified' | 'unverified'): void {
    this.verificationFilter.set(value);
    this.currentPage.set(1);
    this.loadUsers();
  }

  onTeamFilterChange(value: string): void {
    this.teamFilter.set(value);
    this.currentPage.set(1);
    this.loadUsers();
  }

  onPageChange(page: number): void {
    if (page < 1) return;
    this.currentPage.set(page);
    this.loadUsers();
  }

  onSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  toggleSelectAll(): void {
    const displayed = this.displayedUsers();
    if (displayed.every(user => this.selectedUserIds().has(user.id))) {
      this.selectedUserIds.set(new Set());
    } else {
      const allIds = new Set(displayed.map(user => user.id));
      this.selectedUserIds.set(allIds);
    }
  }

  toggleSelectUser(userId: string): void {
    const selected = new Set(this.selectedUserIds());
    if (selected.has(userId)) {
      selected.delete(userId);
    } else {
      selected.add(userId);
    }
    this.selectedUserIds.set(selected);
  }

  openCreateModal(): void {
    this.createError.set(null);
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  onCreateSubmit(formData: CreateUserDto): void {
    this.createError.set(null);

    if (!formData.email || !formData.password || !formData.fullName) {
      this.createError.set('Please fill in all required fields');
      return;
    }

    this.loading.set(true);
    this.userApi.createUser(formData).subscribe({
      next: () => {
        this.loading.set(false);
        this.closeCreateModal();
        this.loadUsers();
        this.alerts
          .open('User created successfully', {
            appearance: 'success',
            label: 'Success',
            autoClose: 3000,
          })
          .subscribe();
      },
      error: (error) => {
        this.loading.set(false);
        this.createError.set(error.error?.message || 'Failed to create user');
      },
    });
  }

  openEditModal(user: User): void {
    this.selectedUser.set(user);
    this.editError.set(null);
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedUser.set(null);
  }

  onEditSubmit(formData: Partial<UpdateUserDto>): void {
    const user = this.selectedUser();
    if (!user) return;

    this.editError.set(null);

    // Optimistically update the UI immediately
    const userIndex = this.users().findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      const updatedUsers = [...this.users()];
      const selectedTeam = this.teams().find(t => t.id === formData.favoriteTeamId);

      updatedUsers[userIndex] = {
        ...updatedUsers[userIndex],
        fullName: formData.fullName || updatedUsers[userIndex].fullName,
        username: formData.username || updatedUsers[userIndex].username,
        isActive: formData.isActive !== undefined ? formData.isActive : updatedUsers[userIndex].isActive,
        profile: {
          ...updatedUsers[userIndex].profile,
          favorite_team_id: formData.favoriteTeamId,
          favorite_team: formData.favoriteTeamId ? selectedTeam : updatedUsers[userIndex].profile?.favorite_team,
          avatar_url: formData.avatar_url,
          bio: formData.bio,
          notifications_enabled: formData.notifications_enabled ?? true,
        } as any
      };
      this.users.set(updatedUsers);
    }

    this.closeEditModal();

    // Update on the server in the background
    this.userApi.updateUser(user.id, formData).subscribe({
      next: () => {
        this.loadUsersInBackground();
        this.alerts
          .open('User updated successfully', {
            appearance: 'success',
            label: 'Success',
            autoClose: 3000,
          })
          .subscribe();
      },
      error: (error) => {
        this.loadUsers();
        this.alerts
          .open('Failed to update user: ' + (error.error?.message || 'Unknown error'), {
            appearance: 'error',
            label: 'Update Failed',
            autoClose: 5000,
          })
          .subscribe();
      },
    });
  }

  openDeleteModal(user: User): void {
    this.selectedUser.set(user);
    this.deleteError.set(null);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedUser.set(null);
  }

  onDeleteConfirm(): void {
    const user = this.selectedUser();
    if (!user) return;

    this.deleteError.set(null);

    const updatedUsers = this.users().filter(u => u.id !== user.id);
    this.users.set(updatedUsers);
    this.totalUsers.set(this.totalUsers() - 1);

    this.closeDeleteModal();

    this.userApi.deleteUser(user.id).subscribe({
      next: () => {
        this.loadUsersInBackground();
        this.alerts
          .open('User deleted successfully', {
            appearance: 'success',
            label: 'Success',
            autoClose: 3000,
          })
          .subscribe();
      },
      error: (error) => {
        this.loadUsers();
        this.alerts
          .open('Failed to delete user: ' + (error.error?.message || 'Unknown error'), {
            appearance: 'error',
            label: 'Delete Failed',
            autoClose: 5000,
          })
          .subscribe();
      },
    });
  }

  openBulkStatusUpdateModal(action: 'activate' | 'deactivate'): void {
    if (this.selectedCount() === 0) return;
    this.bulkStatusAction.set(action);
    this.showBulkStatusUpdateModal.set(true);
  }

  closeBulkStatusUpdateModal(): void {
    this.showBulkStatusUpdateModal.set(false);
  }

  onBulkStatusUpdateConfirm(): void {
    const idsToUpdate = Array.from(this.selectedUserIds());
    const action = this.bulkStatusAction();
    if (idsToUpdate.length === 0 || !action) return;

    this.bulkActionLoading.set(true);

    const isActive = action === 'activate';

    const updatedUsers = this.users().map(user => {
      if (idsToUpdate.includes(user.id)) {
        return { ...user, isActive };
      }
      return user;
    });
    this.users.set(updatedUsers);
    this.selectedUserIds.set(new Set());
    this.closeBulkStatusUpdateModal();

    let completed = 0;
    let failed = 0;

    idsToUpdate.forEach(id => {
      this.userApi.toggleActive(id).subscribe({
        next: () => {
          completed++;
          if (completed + failed === idsToUpdate.length) {
            this.bulkActionLoading.set(false);
            this.loadUsersInBackground();
            if (failed === 0) {
              this.alerts
                .open(`Successfully ${action}d ${completed} user(s)`, {
                  appearance: 'success',
                  label: 'Success',
                  autoClose: 3000,
                })
                .subscribe();
            } else {
              this.alerts
                .open(`${action}d ${completed} user(s), failed to update ${failed}`, {
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
              this.loadUsers();
              this.alerts
                .open(`Failed to ${action} users`, {
                  appearance: 'error',
                  label: 'Update Failed',
                  autoClose: 5000,
                })
                .subscribe();
            } else {
              this.loadUsersInBackground();
              this.alerts
                .open(`${action}d ${completed} user(s), failed to update ${failed}`, {
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

  openBulkDeleteModal(): void {
    if (this.selectedCount() === 0) return;
    this.showBulkDeleteModal.set(true);
  }

  closeBulkDeleteModal(): void {
    this.showBulkDeleteModal.set(false);
  }

  onBulkDeleteConfirm(): void {
    const idsToDelete = Array.from(this.selectedUserIds());
    if (idsToDelete.length === 0) return;

    this.bulkActionLoading.set(true);

    const updatedUsers = this.users().filter(user => !idsToDelete.includes(user.id));
    this.users.set(updatedUsers);
    this.totalUsers.set(this.totalUsers() - idsToDelete.length);
    this.selectedUserIds.set(new Set());
    this.closeBulkDeleteModal();

    let completed = 0;
    let failed = 0;

    idsToDelete.forEach(id => {
      this.userApi.deleteUser(id).subscribe({
        next: () => {
          completed++;
          if (completed + failed === idsToDelete.length) {
            this.bulkActionLoading.set(false);
            this.loadUsersInBackground();
            if (failed === 0) {
              this.alerts
                .open(`Successfully deleted ${completed} user(s)`, {
                  appearance: 'success',
                  label: 'Success',
                  autoClose: 3000,
                })
                .subscribe();
            } else {
              this.alerts
                .open(`Deleted ${completed} user(s), failed to delete ${failed}`, {
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
              this.loadUsers();
              this.alerts
                .open('Failed to delete users', {
                  appearance: 'error',
                  label: 'Delete Failed',
                  autoClose: 5000,
                })
                .subscribe();
            } else {
              this.loadUsersInBackground();
              this.alerts
                .open(`Deleted ${completed} user(s), failed to delete ${failed}`, {
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

  toggleUserStatus(user: User): void {
    const userIndex = this.users().findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      const updatedUsers = [...this.users()];
      updatedUsers[userIndex] = {
        ...updatedUsers[userIndex],
        isActive: !updatedUsers[userIndex].isActive
      };
      this.users.set(updatedUsers);
    }

    this.userApi.toggleActive(user.id).subscribe({
      next: () => {
        this.loadUsersInBackground();
      },
      error: (error) => {
        this.loadUsers();
      },
    });
  }

  // Edit form change handlers
  onEditFullNameChange(value: string): void {
    this.editForm.update(form => ({ ...form, fullName: value }));
  }

  onEditUsernameChange(value: string): void {
    this.editForm.update(form => ({ ...form, username: value }));
  }

  onEditAvatarChange(value: string): void {
    this.editForm.update(form => ({ ...form, avatar_url: value }));
  }

  onEditBioChange(value: string): void {
    this.editForm.update(form => ({ ...form, bio: value }));
  }

  onEditTeamChange(value: number | undefined): void {
    this.editForm.update(form => ({ ...form, favoriteTeamId: value }));
  }

  onEditActiveChange(value: boolean): void {
    this.editForm.update(form => ({ ...form, isActive: value }));
  }

  onEditNotificationsChange(value: boolean): void {
    this.editForm.update(form => ({ ...form, notifications_enabled: value }));
  }

  // Helper methods
  isSomeSelected(): boolean {
    const displayed = this.displayedUsers();
    const selectedCount = displayed.filter(user => this.selectedUserIds().has(user.id)).length;
    return selectedCount > 0 && selectedCount < displayed.length;
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUserIds().has(userId);
  }

  isAllSelected(): boolean {
    const displayed = this.displayedUsers();
    return displayed.length > 0 && displayed.every(user => this.selectedUserIds().has(user.id));
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  totalPages(): number {
    return Math.ceil(this.totalUsers() / 20); // Assuming 20 items per page
  }

  formatDate(date: string): string {
    if (!date) return 'Never';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getFavoriteTeamName(user: User): string {
    return user.profile?.favorite_team?.name || '';
  }
}
