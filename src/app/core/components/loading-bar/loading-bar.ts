import { Component, inject } from '@angular/core';
import { LoadingService } from '../../shared/services';

@Component({
  selector: 'app-loading-bar',
  imports: [],
  template: `
    @if (loadingService.isLoading()) {
      <div class="loading-bar">
        <div class="loading-bar-progress"></div>
      </div>
    }
  `,
  styles: `
    .loading-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      z-index: 9999;
      background: rgba(58, 38, 52, 0.3);
      overflow: hidden;
    }

    .loading-bar-progress {
      height: 100%;
      background: linear-gradient(90deg, #ea5e2b 0%, #c53939 50%, #3A2634 100%);
      animation: loading 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      transform-origin: left;
      box-shadow: 0 0 10px rgba(228, 94, 44, 0.6);
    }

    @keyframes loading {
      0% {
        transform: translateX(-100%) scaleX(0);
      }
      50% {
        transform: translateX(0%) scaleX(0.3);
      }
      100% {
        transform: translateX(100%) scaleX(1);
      }
    }
  `,
})
export class LoadingBar {
  readonly loadingService = inject(LoadingService);
}
