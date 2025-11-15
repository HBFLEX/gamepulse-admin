import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiIcon } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { ContentPerformance } from '../../../../../core/models/admin.models';

@Component({
  selector: 'app-content-performance',
  standalone: true,
  imports: [CommonModule, TuiIcon, TuiCardLarge],
  templateUrl: './content-performance.component.html',
  styleUrl: './content-performance.component.less',
})
export class ContentPerformanceComponent {
  readonly content = input<ContentPerformance[]>([]);

  getTypeIcon(type: string): string {
    switch (type) {
      case 'story':
        return '@tui.file-text';
      case 'moment':
        return '@tui.video';
      case 'news':
        return '@tui.rss';
      default:
        return '@tui.file';
    }
  }

  formatViews(views: number): string {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  }
}
