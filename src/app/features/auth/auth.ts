import { Component, inject, signal } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {
  TuiLabel,
  TuiTextfield,
  TuiTitle,
  TuiButton,
  TuiTextfieldComponent, TuiIcon,
} from '@taiga-ui/core';
import { AuthService } from './services/auth-service';
import {TuiForm, TuiHeader} from '@taiga-ui/layout';
import { NgOptimizedImage } from '@angular/common';
import {TuiPassword} from '@taiga-ui/kit';

@Component({
  selector: 'app-auth',
  imports: [
    NgOptimizedImage,
    TuiForm,
    TuiHeader,
    TuiTitle,
    TuiLabel,
    TuiIcon,
    TuiTextfieldComponent,
    TuiTextfield,
    TuiButton,
    FormsModule,
    TuiPassword,
  ],
  templateUrl: './auth.html',
  styleUrl: './auth.less',
})
export class Auth {
  private readonly authService = inject(AuthService);

  email = signal('');
  password = signal('');

  readonly isLoading = this.authService.isLoading;
  readonly error = this.authService.error;

  async onSubmit(): Promise<void> {
    if (!this.email() || !this.password()) return;

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
