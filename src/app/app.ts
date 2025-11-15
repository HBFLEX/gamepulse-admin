import { TuiRoot } from '@taiga-ui/core';
import { LoadingBar, NetworkStatus } from './core/components';
import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TuiRoot, LoadingBar, NetworkStatus],
  templateUrl: './app.html',
  styleUrl: './app.less'
})
export class App {
  protected readonly title = signal('gamepulse-admin');
  protected readonly themeService = inject(ThemeService);
}
