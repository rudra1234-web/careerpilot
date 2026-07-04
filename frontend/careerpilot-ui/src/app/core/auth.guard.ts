import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

/** Sends anonymous visitors to the Keycloak login, preserving the target URL. */
export const authGuard: CanActivateFn = async (route, state) => {
  const keycloak = inject(KeycloakService);
  if (await keycloak.isLoggedIn()) return true;
  await keycloak.login({ redirectUri: window.location.origin + state.url });
  return false;
};
