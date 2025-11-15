import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiIcon } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';

interface ContentTypeData {
  type: string;
  count: number;
  color: string;
  icon: string;
}

@Component({
  selector: 'app-content-types-chart',
  standalone: true,
  imports: [CommonModule, TuiIcon, TuiCardLarge],
  templateUrl: './content-types-chart.component.html',
  styleUrl: './content-types-chart.component.less',
})
export class ContentTypesChartComponent {
  readonly data = input<ContentTypeData[]>([]);

  readonly chartValue = computed(() => {
    return this.data().map(d => [d.count]);
  });

  readonly maxValue = computed(() => {
    const values = this.data().map(d => d.count);
    return values.length > 0 ? Math.max(...values) : 100;
  });
}
