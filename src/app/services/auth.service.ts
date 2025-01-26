import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {RoutePaths} from "../enums/route-paths";
import {CommonService} from './common.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'auth_token'; // Store token in localStorage
  private usernameKey = 'username'; // Store username in localStorage
  private userFamilyId = 'user_familyId'; // Store family id in localStorage
  private userId = 'userId'; // Store user id in localStorage

  constructor(private router: Router, private commonService: CommonService) {}

  setUsername(username: string) {
    localStorage.setItem(this.usernameKey, username); // Store username
  }

  clearUsername() {
    localStorage.removeItem(this.usernameKey);
  }

  getUsername(): string {
    return localStorage.getItem(this.usernameKey) || 'Guest'; // Get username from storage
  }

  setUserFamilyId(familyId: number) {
    localStorage.setItem(this.userFamilyId, familyId.toString()); // Store familyId
  }

  clearUserFamilyId() {
    localStorage.removeItem(this.userFamilyId);
  }

  getUserFamilyId(): number | null {
    const familyId = localStorage.getItem(this.userFamilyId);
    return familyId ? Number.parseInt(familyId) : null; // Return null if familyId is not found
  }

  setUserId(userId: number) {
    localStorage.setItem(this.userId, userId.toString()); // Store familyId
  }

  clearUserId() {
    localStorage.removeItem(this.userId);
  }

  getUserId(): number | null {
    const userId = localStorage.getItem(this.userId);
    return userId ? Number.parseInt(userId) : null; // Return null if userId is not found
  }

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token); // Store token
  }

  clearToken() {
    localStorage.removeItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey); // Get token from storage
  }

  isLoggedIn(): boolean {
    return !!this.getToken(); // Check if token exists
  }

  logout() {
    localStorage.clear(); // Clear all stored data
    this.commonService.clearUserData();
    void this.router.navigate([RoutePaths.Home]); // Redirect to home page
  }
}
