import { Component, input, output, inject } from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';
import { NgOptimizedImage } from '@angular/common';
import { ThemeService } from '../../../../core/services/theme.service';

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
  private readonly themeService = inject(ThemeService);
  
  readonly isCollapsed = input<boolean>(false);
  readonly isMobileOpen = input<boolean>(false);
  readonly navItems = input<NavItem[]>([]);
  readonly accordionToggle = output<NavItem>();
  
  // Expose theme for template binding
  readonly theme = this.themeService.theme;

  onToggleAccordion(item: NavItem): void {
    this.accordionToggle.emit(item);
  }
}
