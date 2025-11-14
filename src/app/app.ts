import { TuiRoot } from '@taiga-ui/core';
import { LoadingBar, NetworkStatus } from './core/components';
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TuiRoot, LoadingBar, NetworkStatus],
  templateUrl: './app.html',
  styleUrl: './app.less'
})
export class App {
  protected readonly title = signal('gamepulse-admin');
}
