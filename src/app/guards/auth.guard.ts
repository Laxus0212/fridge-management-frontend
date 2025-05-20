import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import {RoutePaths} from "../enums/route-paths";

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      console.log('Auth guard accept');
      return true;
    } else {
      console.log('Auth guard reject');
      void this.router.navigate([RoutePaths.Error]);
      return false;
    }
  }
}
