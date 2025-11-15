import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiIcon } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { TuiAxes, TuiLineChart } from '@taiga-ui/addon-charts';
import { TuiPoint } from '@taiga-ui/core/types';
import { UserEngagement } from '../../../../../core/models/admin.models';

@Component({
  selector: 'app-engagement-chart',
  standalone: true,
  imports: [CommonModule, TuiIcon, TuiCardLarge, TuiAxes, TuiLineChart],
  templateUrl: './engagement-chart.component.html',
  styleUrl: './engagement-chart.component.less',
})
export class EngagementChartComponent {
  readonly data = input<UserEngagement[]>([]);

  readonly activeUsersData = computed<ReadonlyArray<TuiPoint>>(() => {
    return this.data().map((item, index) => [index, item.activeUsers]);
  });

  readonly pageViewsData = computed<ReadonlyArray<TuiPoint>>(() => {
    return this.data().map((item, index) => [index, item.pageViews / 100]); // Scale down for visibility
  });

  readonly yStringify = (y: number): string => {
    if (y >= 1000) {
      return `${(y / 1000).toFixed(1)}k`;
    }
    return y.toString();
  };

  readonly xStringify = (x: number): string => {
    const item = this.data()[x];
    if (!item) return '';
    const date = new Date(item.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  readonly maxY = computed(() => {
    const users = this.data().map((d) => d.activeUsers);
    return Math.max(...users, 50000);
  });

  readonly avgDailyUsers = computed(() => {
    const data = this.data();
    if (data.length === 0) return 0;
    return Math.round(data.reduce((sum, d) => sum + d.activeUsers, 0) / data.length);
  });

  readonly avgSessionTime = computed(() => {
    const data = this.data();
    if (data.length === 0) return 0;
    return ((data.reduce((sum, d) => sum + d.avgSessionDuration, 0) / data.length) / 60).toFixed(
      1,
    );
  });
}
