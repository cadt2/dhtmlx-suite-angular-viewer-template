import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  hasPermission(roles: string[]): boolean {
    // Static demonstration: Allow all roles for now
    return true;
  }
}