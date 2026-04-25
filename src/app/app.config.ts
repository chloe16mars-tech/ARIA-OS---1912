import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners, isDevMode,
  provideZonelessChangeDetection,
} from '@angular/core';
import {provideRouter, withInMemoryScrolling, withPreloading, PreloadAllModules} from '@angular/router';

import {routes} from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
  ],
};
