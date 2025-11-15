import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiIcon, TuiHint } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { TuiPieChart } from '@taiga-ui/addon-charts';

interface TeamDistribution {
  name: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-team-distribution-chart',
  standalone: true,
  imports: [CommonModule, TuiIcon, TuiCardLarge, TuiPieChart, TuiHint],
  templateUrl: './team-distribution-chart.component.html',
  styleUrl: './team-distribution-chart.component.less',
})
export class TeamDistributionChartComponent {
  readonly data = input<TeamDistribution[]>([]);

  readonly chartValue = computed(() => {
    return this.data().map(d => d.value);
  });

  readonly chartLabels = computed(() => {
    return this.data().map(d => d.name);
  });

  readonly total = computed(() => {
    return this.data().reduce((sum, d) => sum + d.value, 0);
  });
}
