import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiIcon } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { SystemHealth } from '../../../../../core/models/admin.models';

@Component({
  selector: 'app-system-health',
  standalone: true,
  imports: [CommonModule, TuiIcon, TuiCardLarge],
  templateUrl: './system-health.component.html',
  styleUrl: './system-health.component.less',
})
export class SystemHealthComponent {
  readonly health = input<SystemHealth | null>();

  getStatusIcon(status: string): string {
    switch (status) {
      case 'operational':
      case 'healthy':
        return '@tui.check-circle';
      case 'degraded':
        return '@tui.alert-triangle';
      case 'down':
      case 'unhealthy':
        return '@tui.x-circle';
      default:
        return '@tui.help-circle';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'operational':
      case 'healthy':
        return '#10b981';
      case 'degraded':
        return '#f59e0b';
      case 'down':
      case 'unhealthy':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  }
}
