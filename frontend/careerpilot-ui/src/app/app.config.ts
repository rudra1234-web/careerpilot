import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { KeycloakBearerInterceptor, KeycloakService } from 'keycloak-angular';

import { routes } from './app.routes';

function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        // Same-origin in production (served behind the reverse proxy at /auth);
        // falls back to the local Keycloak dev port when running `ng serve` on :4200.
        url:
          window.location.port === '4200'
            ? 'http://localhost:8180'
            : `${window.location.origin}/auth`,
        realm: 'careerpilot',
        clientId: 'careerpilot-ui',
      },
      initOptions: {
        onLoad: 'check-sso',   // public landing page; app routes use authGuard
        checkLoginIframe: false,
      },
      enableBearerInterceptor: true,
    });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    KeycloakService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      deps: [KeycloakService],
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: KeycloakBearerInterceptor,
      multi: true,
    },
  ],
};
