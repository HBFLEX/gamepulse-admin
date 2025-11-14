import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class NetworkService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly _isOnline = signal(true);

  readonly isOnline = this._isOnline.asReadonly();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this._isOnline.set(navigator.onLine);

      window.addEventListener('online', () => this._isOnline.set(true));
      window.addEventListener('offline', () => this._isOnline.set(false));
    }
  }
}
