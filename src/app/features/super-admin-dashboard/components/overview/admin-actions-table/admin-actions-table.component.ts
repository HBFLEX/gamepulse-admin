import { Component, input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiIcon, TuiLink } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { TuiTable } from '@taiga-ui/addon-table';
import { AdminAction } from '../../../../../core/models/admin.models';

@Component({
  selector: 'app-admin-actions-table',
  standalone: true,
  imports: [CommonModule, TuiIcon, TuiLink, TuiCardLarge, TuiTable],
  templateUrl: './admin-actions-table.component.html',
  styleUrl: './admin-actions-table.component.less',
})
export class AdminActionsTableComponent {
  readonly actions = input<AdminAction[]>([]);
  readonly columns = ['user', 'action', 'entity', 'time'];
  
  protected sortedActions = signal<AdminAction[]>([]);
  protected sortColumn = signal<string>('time');
  protected sortDirection = signal<'asc' | 'desc'>('desc');

  constructor() {
    // Update sorted actions whenever input changes
    effect(() => {
      const actions = this.actions();
      if (actions && actions.length > 0) {
        this.sortedActions.set(this.sortData(actions, this.sortColumn(), this.sortDirection()));
      }
    });
  }

  getUserInitial(user: string): string {
    return user && user.length > 0 ? user[0].toUpperCase() : '?';
  }

  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const actionTime = new Date(timestamp);
    const diff = Math.floor((now.getTime() - actionTime.getTime()) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  sortBy(column: string): void {
    if (this.sortColumn() === column) {
      // Toggle direction
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    
    // Re-sort data
    const actions = this.actions();
    if (actions && actions.length > 0) {
      this.sortedActions.set(this.sortData(actions, this.sortColumn(), this.sortDirection()));
    }
  }

  private sortData(data: AdminAction[], column: string, direction: 'asc' | 'desc'): AdminAction[] {
    const sorted = [...data].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (column) {
        case 'user':
          valueA = a.user.toLowerCase();
          valueB = b.user.toLowerCase();
          break;
        case 'action':
          valueA = a.action.toLowerCase();
          valueB = b.action.toLowerCase();
          break;
        case 'entity':
          valueA = `${a.entity}${a.entityId}`.toLowerCase();
          valueB = `${b.entity}${b.entityId}`.toLowerCase();
          break;
        case 'time':
          valueA = new Date(a.timestamp).getTime();
          valueB = new Date(b.timestamp).getTime();
          break;
        default:
          return 0;
      }

      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }
}
