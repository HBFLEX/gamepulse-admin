import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton } from '@taiga-ui/core';
import { TuiInputModule, TuiInputPasswordModule } from '@taiga-ui/legacy';
import { AuthService } from './services/auth-service';

@Component({
  selector: 'app-auth',
  imports: [FormsModule, TuiButton, TuiInputModule, TuiInputPasswordModule],
  templateUrl: './auth.html',
  styleUrl: './auth.less',
})
export class Auth {
  private readonly authService = inject(AuthService);

  readonly email = signal('');
  readonly password = signal('');
  readonly showPassword = signal(false);

  readonly isLoading = this.authService.isLoading;
  readonly error = this.authService.error;

  async onSubmit(): Promise<void> {
    if (!this.email() || !this.password()) {
      return;
    }

    try {
      await this.authService.login({
        email: this.email(),
        password: this.password(),
      });
    } catch (error) {
      console.error('Login error:', error);
    }
  }
}
