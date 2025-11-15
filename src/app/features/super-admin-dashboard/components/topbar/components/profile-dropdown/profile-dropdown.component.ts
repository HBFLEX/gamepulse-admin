import { Component, input, output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiDataList, TuiDropdown, TuiIcon } from '@taiga-ui/core';
import { TuiAvatar } from '@taiga-ui/kit';
import { ThemeService } from '../../../../../../core/services/theme.service';

@Component({
  selector: 'app-profile-dropdown',
  standalone: true,
  imports: [TuiButton, TuiDropdown, TuiDataList, TuiAvatar, TuiIcon, FormsModule],
  templateUrl: './profile-dropdown.component.html',
  styleUrl: './profile-dropdown.component.less',
})
export class ProfileDropdownComponent {
  readonly userName = input<string>('');
  readonly userEmail = input<string>('');
  readonly userRole = input<string>('');
  readonly logoutClick = output<void>();
  readonly themeService = inject(ThemeService);
  readonly isOpen = signal(false);

  getInitials(name: string, email: string): string {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  }

  onLogout(): void {
    this.logoutClick.emit();
    this.isOpen.set(false);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
