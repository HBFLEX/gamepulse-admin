import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../auth/services/auth-service';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { TopbarComponent } from './components/topbar/topbar.component';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: NavItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [SidebarComponent, TopbarComponent],
  templateUrl: './super-admin-dashboard.html',
  styleUrl: './super-admin-dashboard.less',
})
export class SuperAdminDashboard {
  readonly authService = inject(AuthService);
  readonly isSidebarCollapsed = signal(false);
  readonly isMobileMenuOpen = signal(false);

  readonly navItems: NavItem[] = [
    { label: 'Overview', icon: '@tui.bar-chart', route: '/super-admin' },
    {
      label: 'User Management',
      icon: '@tui.users',
      expanded: false,
      children: [
        { label: 'Admins', icon: '@tui.user-check', route: '/super-admin/admins' },
        { label: 'Users', icon: '@tui.user', route: '/super-admin/users' },
        { label: 'Roles', icon: '@tui.shield', route: '/super-admin/roles' },
      ],
    },
    {
      label: 'League Mgmt',
      icon: '@tui.award',
      expanded: false,
      children: [
        { label: 'Teams', icon: '@tui.users', route: '/super-admin/teams' },
        { label: 'Players', icon: '@tui.user', route: '/super-admin/players' },
        { label: 'Coaches', icon: '@tui.user-check', route: '/super-admin/coaches' },
        { label: 'Seasons', icon: '@tui.calendar', route: '/super-admin/seasons' },
      ],
    },
    {
      label: 'Games',
      icon: '@tui.play-circle',
      expanded: false,
      children: [
        { label: 'Schedule', icon: '@tui.calendar', route: '/super-admin/schedule' },
        { label: 'Live Games', icon: '@tui.radio', route: '/super-admin/live' },
        { label: 'Results', icon: '@tui.check-circle', route: '/super-admin/results' },
        { label: 'Locations', icon: '@tui.map-pin', route: '/super-admin/locations' },
      ],
    },
    {
      label: 'Statistics',
      icon: '@tui.trending-up',
      expanded: false,
      children: [
        { label: 'Player Stats', icon: '@tui.user', route: '/super-admin/player-stats' },
        { label: 'Team Stats', icon: '@tui.users', route: '/super-admin/team-stats' },
        { label: 'Standings', icon: '@tui.list', route: '/super-admin/standings' },
      ],
    },
    {
      label: 'Content',
      icon: '@tui.file-text',
      expanded: false,
      children: [
        { label: 'News', icon: '@tui.book-open', route: '/super-admin/news' },
        { label: 'Stories', icon: '@tui.message-circle', route: '/super-admin/stories' },
        { label: 'Moments', icon: '@tui.star', route: '/super-admin/moments' },
        { label: 'Banners', icon: '@tui.image', route: '/super-admin/banners' },
        { label: 'Hero Sections', icon: '@tui.layout', route: '/super-admin/hero' },
      ],
    },
    {
      label: 'Analytics',
      icon: '@tui.activity',
      expanded: false,
      children: [
        { label: 'Traffic', icon: '@tui.trending-up', route: '/super-admin/traffic' },
        { label: 'Engagement', icon: '@tui.heart', route: '/super-admin/engagement' },
        { label: 'Reports', icon: '@tui.file', route: '/super-admin/reports' },
      ],
    },
    { label: 'Media Library', icon: '@tui.folder', route: '/super-admin/media' },
    { label: 'Notifications', icon: '@tui.bell', route: '/super-admin/notifications' },
    {
      label: 'System',
      icon: '@tui.settings',
      expanded: false,
      children: [
        { label: 'Audit Logs', icon: '@tui.file-text', route: '/super-admin/logs' },
        { label: 'Settings', icon: '@tui.sliders', route: '/super-admin/settings' },
        { label: 'Cache Mgmt', icon: '@tui.database', route: '/super-admin/cache' },
      ],
    },
  ];

  toggleSidebar(): void {
    this.isSidebarCollapsed.update((v) => !v);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((v) => !v);
  }

  toggleAccordion(item: NavItem): void {
    if (item.children) {
      item.expanded = !item.expanded;
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
