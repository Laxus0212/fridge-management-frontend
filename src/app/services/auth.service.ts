import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {RoutePaths} from "../enums/route-paths";
import {CommonService} from './common.service';
import {LoginUserReq, User, UserService} from '../openapi/generated-src';
import {CacheService} from './cache.service';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usernameKey = 'username'; // Store username in localStorage
  private emailKey = 'email'; // Store username in localStorage
  private userFamilyId = 'user_familyId'; // Store family id in localStorage
  private userId = 'userId'; // Store user id in localStorage

  private userIdSubject = new BehaviorSubject<number | null>(this.getUserId());
  private userFamilyIdSubject = new BehaviorSubject<number | null>(this.getUserFamilyId());

  userId$ = this.userIdSubject.asObservable();
  userFamilyId$ = this.userFamilyIdSubject.asObservable();

  constructor(
    private router: Router,
    private commonService: CommonService,
    private userService: UserService,
    private cacheService: CacheService
  ) {
  }

  getEmail(): string {
    return localStorage.getItem(this.emailKey) || ''; // Get email from storage
  }

  setEmail(email: string) {
    localStorage.setItem(this.emailKey, email); // Store email
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
    this.userFamilyIdSubject.next(familyId);
  }

  clearUserFamilyId() {
    localStorage.removeItem(this.userFamilyId);
    this.userFamilyIdSubject.next(null);
  }

  getUserFamilyId(): number | null {
    const familyId = localStorage.getItem(this.userFamilyId);
    return familyId ? Number.parseInt(familyId) : null;
  }

  setUserId(userId: number) {
    localStorage.setItem(this.userId, userId.toString());
    this.userIdSubject.next(userId);
  }

  clearUserId() {
    localStorage.removeItem(this.userId);
    this.userIdSubject.next(null);
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
        this.cacheService.clearCache(); // Clear cache
        localStorage.clear(); // Clear all stored data
        this.commonService.clearUserData();
        this.userIdSubject.next(null);
        this.userFamilyIdSubject.next(null);
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
        this.userIdSubject.next(null);
        this.userFamilyIdSubject.next(null);
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
        this.cacheService.fullLoad(this.getUserId(), this.getUserFamilyId());
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
    this.setEmail(user.email!); // Store username
    if (user.familyId) {
      this.setUserFamilyId(user.familyId); // Store family id
      void this.cacheService.getChat(user.familyId);
    }
    this.setUserId(user.userId!); // Store user id
  }
}
