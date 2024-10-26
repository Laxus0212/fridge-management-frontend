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
      return true; // Allow route if the user is logged in
    } else {
      void this.router.navigate([RoutePaths.Home]); // Redirect to home page
      return false;
    }
  }
}
