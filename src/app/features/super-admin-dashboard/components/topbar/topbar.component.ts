import { Component, input, output } from '@angular/core';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { ProfileDropdownComponent } from './components/profile-dropdown/profile-dropdown.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [TuiButton, TuiIcon, ProfileDropdownComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.less',
})
export class TopbarComponent {
  readonly userName = input<string>('');
  readonly userEmail = input<string>('');
  readonly userRole = input<string>('');
  readonly isSidebarCollapsed = input<boolean>(false);
  readonly sidebarToggle = output<void>();
  readonly mobileMenuToggle = output<void>();
  readonly logoutClick = output<void>();

  onSidebarToggle(): void {
    this.sidebarToggle.emit();
  }

  onMobileMenuToggle(): void {
    this.mobileMenuToggle.emit();
  }

  onLogout(): void {
    this.logoutClick.emit();
  }
}
