import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiIcon } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';

interface Role {
  id: number;
  role_name: string;
  display_name: string;
  description: string;
  permissions: string[];
  color: string;
  icon: string;
}

interface PermissionGroup {
  category: string;
  permissions: string[];
  icon: string;
  color: string;
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    TuiIcon,
    TuiCardLarge,
  ],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.less',
})
export class RolesComponent implements OnInit {
  loading = signal(false);
  selectedRole = signal<Role | null>(null);

  // Fixed roles based on the backend schema
  roles = signal<Role[]>([
    {
      id: 1,
      role_name: 'super_admin',
      display_name: 'Super Admin',
      description: 'Full system access with all permissions. Can manage admins, roles, and system settings.',
      permissions: ['manage_admins', 'manage_roles', 'access_audit_logs', 'manage_app_settings'],
      color: '#E45E2C',
      icon: '@tui.shield-check',
    },
    {
      id: 2,
      role_name: 'league_admin',
      display_name: 'League Admin',
      description: 'Manages leagues, teams, seasons, and schedules for their assigned league.',
      permissions: [
        'create_league', 'edit_league', 'delete_league',
        'create_team', 'edit_team', 'delete_team',
        'create_season', 'edit_season', 'delete_season',
        'manage_standings', 'manage_schedules'
      ],
      color: '#3b82f6',
      icon: '@tui.trophy',
    },
    {
      id: 3,
      role_name: 'team_admin',
      display_name: 'Team Admin',
      description: 'Manages team information, players, coaches, and team statistics.',
      permissions: [
        'edit_team_info',
        'manage_players',
        'manage_coaches',
        'manage_team_stats'
      ],
      color: '#10b981',
      icon: '@tui.users',
    },
    {
      id: 4,
      role_name: 'content_admin',
      display_name: 'Content Admin',
      description: 'Creates and manages news, stories, moments, banners, and hero sections.',
      permissions: [
        'create_news', 'edit_news', 'delete_news',
        'create_story', 'edit_story', 'delete_story',
        'create_moment', 'edit_moment', 'delete_moment',
        'manage_banners', 'manage_hero_sections'
      ],
      color: '#8b5cf6',
      icon: '@tui.file-text',
    },
    {
      id: 5,
      role_name: 'game_admin',
      display_name: 'Game Admin',
      description: 'Manages games, live scores, play-by-play updates, and game events.',
      permissions: [
        'create_game', 'edit_game', 'delete_game',
        'manage_live_scores', 'manage_play_by_play',
        'manage_game_events', 'start_game', 'end_game'
      ],
      color: '#f59e0b',
      icon: '@tui.activity',
    },
  ]);

  permissionGroups: PermissionGroup[] = [
    {
      category: 'Super Admin',
      permissions: ['manage_admins', 'manage_roles', 'access_audit_logs', 'manage_app_settings'],
      icon: '@tui.shield-check',
      color: '#E45E2C',
    },
    {
      category: 'League Management',
      permissions: [
        'create_league', 'edit_league', 'delete_league',
        'create_team', 'edit_team', 'delete_team',
        'create_season', 'edit_season', 'delete_season',
        'manage_standings', 'manage_schedules'
      ],
      icon: '@tui.trophy',
      color: '#3b82f6',
    },
    {
      category: 'Team Management',
      permissions: [
        'edit_team_info', 'manage_players', 'manage_coaches', 'manage_team_stats'
      ],
      icon: '@tui.users',
      color: '#10b981',
    },
    {
      category: 'Content Management',
      permissions: [
        'create_news', 'edit_news', 'delete_news',
        'create_story', 'edit_story', 'delete_story',
        'create_moment', 'edit_moment', 'delete_moment',
        'manage_banners', 'manage_hero_sections'
      ],
      icon: '@tui.file-text',
      color: '#8b5cf6',
    },
    {
      category: 'Game Management',
      permissions: [
        'create_game', 'edit_game', 'delete_game',
        'manage_live_scores', 'manage_play_by_play',
        'manage_game_events', 'start_game', 'end_game'
      ],
      icon: '@tui.activity',
      color: '#f59e0b',
    },
  ];

  ngOnInit(): void {
    // Select first role by default
    if (this.roles().length > 0) {
      this.selectedRole.set(this.roles()[0]);
    }
  }

  selectRole(role: Role): void {
    this.selectedRole.set(role);
  }

  formatPermission(permission: string): string {
    return permission
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getPermissionCategory(permission: string): string {
    const group = this.permissionGroups.find(g =>
      g.permissions.includes(permission)
    );
    return group ? group.category : 'Other';
  }

  getPermissionColor(permission: string): string {
    const group = this.permissionGroups.find(g =>
      g.permissions.includes(permission)
    );
    return group ? group.color : '#6b7280';
  }

  getRoleStats(): { totalRoles: number; totalPermissions: number; avgPermissions: number } {
    const totalRoles = this.roles().length;
    const totalPermissions = new Set(
      this.roles().flatMap(role => role.permissions)
    ).size;
    const avgPermissions = Math.round(
      this.roles().reduce((sum, role) => sum + role.permissions.length, 0) / totalRoles
    );

    return { totalRoles, totalPermissions, avgPermissions };
  }
}
