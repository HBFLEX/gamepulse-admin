import { provideEventPlugins } from '@taiga-ui/event-plugins';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor, loadingInterceptor, errorInterceptor } from './core/interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors(
        [
          authInterceptor,
          loadingInterceptor,
          errorInterceptor,
        ]
      )
    ),
    provideAnimations(),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideEventPlugins(),
  ],
};
