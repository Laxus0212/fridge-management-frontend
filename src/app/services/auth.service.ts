import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {RoutePaths} from "../enums/route-paths";
import {CommonService} from './common.service';
import {LoginUserReq, User, UserService} from '../openapi/generated-src';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usernameKey = 'username'; // Store username in localStorage
  private userFamilyId = 'user_familyId'; // Store family id in localStorage
  private userId = 'userId'; // Store user id in localStorage

  constructor(private router: Router, private commonService: CommonService, private userService: UserService) {
  }

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
    return familyId ? Number.parseInt(familyId) : null;
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

  isLoggedIn(): boolean {
    return !!this.getUserId(); // Check if userId exists
  }

  logout() {
    this.userService.logoutUser().subscribe({
      next: () => {
        console.log('Logout successful');
        void this.commonService.presentToast('Logout successful!', 'success');
        localStorage.clear(); // Clear all stored data
        this.commonService.clearUserData();
        void this.router.navigate([RoutePaths.Home]); // Redirect to home page
      },
      error: (error) => {
        console.error('Logout failed:', error);
        void this.commonService.presentToast(error.error.message, 'danger');
      }
    });
  }

  public login(loginData: LoginUserReq) {
    this.userService.loginUser(loginData).subscribe({
      next: () => {
        console.log('Login successful');
        void this.commonService.presentToast('Login successful!', 'success');
        this.storeLoggedInUserData();
      },
      error: (error) => {
        console.error('Login failed:', error.error.message);
        void this.commonService.presentToast(error.error.message, 'danger');
      }
    });
  }

  public storeLoggedInUserData() {
    this.userService.getLoggedInUser().subscribe({
      next: (user) => {
        this.storeUserData(user);
      },
      error: (error) => {
        console.error('Login failed:', error.error.message);
        void this.commonService.presentToast(error.error.message, 'danger');
      },
      complete: () => {
        void this.router.navigate([RoutePaths.Fridges]); // Redirect after successful login
      }
    });
  }

  private storeUserData(user: User) {
    this.setUsername(user.username!); // Store username
    if (user.familyId) {
      this.setUserFamilyId(user.familyId); // Store family id
    }
    this.setUserId(user.userId!); // Store user id
  }
}
