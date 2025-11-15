import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiIcon } from '@taiga-ui/core';
import { DashboardStats } from '../../../../../core/models/admin.models';

interface StatCard {
  icon: string;
  title: string;
  value: number | string;
  change?: number;
  subtitle?: string;
  color: string;
}

@Component({
  selector: 'app-stats-cards',
  standalone: true,
  imports: [CommonModule, TuiIcon],
  templateUrl: './stats-cards.component.html',
  styleUrl: './stats-cards.component.less',
})
export class StatsCardsComponent {
  readonly stats = input<DashboardStats | null>();

  get cards(): StatCard[] {
    const data = this.stats();
    if (!data) return [];

    return [
      {
        icon: '@tui.bar-chart',
        title: 'Total Games',
        value: data.totalGames.toLocaleString(),
        change: data.totalGamesChange,
        subtitle: 'vs Last Week',
        color: '#E45E2C',
      },
      {
        icon: '@tui.users',
        title: 'Active Users',
        value: data.activeUsers.toLocaleString(),
        change: data.activeUsersChange,
        subtitle: 'vs Last Week',
        color: '#3A2634',
      },
      {
        icon: '@tui.award',
        title: 'Teams',
        value: data.totalTeams,
        subtitle: 'Active',
        color: '#C53A34',
      },
      {
        icon: '@tui.file-text',
        title: 'News',
        value: data.totalNews,
        subtitle: 'Published',
        color: '#E45E2C',
      },
    ];
  }
}
