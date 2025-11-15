import { Component, input, output } from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';
import { NgOptimizedImage } from '@angular/common';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: NavItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [TuiIcon, NgOptimizedImage],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.less',
})
export class SidebarComponent {
  readonly isCollapsed = input<boolean>(false);
  readonly isMobileOpen = input<boolean>(false);
  readonly navItems = input<NavItem[]>([]);
  readonly accordionToggle = output<NavItem>();

  onToggleAccordion(item: NavItem): void {
    this.accordionToggle.emit(item);
  }
}
