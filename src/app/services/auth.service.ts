import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {RoutePaths} from "../enums/route-paths";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'auth_token'; // Store token in localStorage
  private usernameKey = 'username'; // Store username in localStorage
  private userFamilyId = 'user_family_id'; // Store family id in localStorage
  private userId = 'user_id'; // Store user id in localStorage

  constructor(private router: Router) {}

  setUsername(username: string) {
    localStorage.setItem(this.usernameKey, username); // Store username
  }

  getUsername(): string {
    return localStorage.getItem(this.usernameKey) || 'Guest'; // Get username from storage
  }

  setUserFamilyId(familyId: number) {
    localStorage.setItem(this.userFamilyId, familyId.toString()); // Store familyId
  }

  getUserFamilyId(): number {
    return Number.parseInt(localStorage.getItem(this.userFamilyId) || '-1'); // Get familyId from storage
  }

  setUserId(userId: number) {
    localStorage.setItem(this.userId, userId.toString()); // Store familyId
  }

  getUserId(): number {
    return Number.parseInt(localStorage.getItem(this.userId) || '-1'); // Get userId from storage
  }

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token); // Store token
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey); // Get token from storage
  }

  isLoggedIn(): boolean {
    return !!this.getToken(); // Check if token exists
  }

  logout() {
    //const registerRoute = RoutePaths.Register;
    localStorage.clear(); // Clear all stored data
    void this.router.navigate([RoutePaths.Home]); // Redirect to home page
  }
}
