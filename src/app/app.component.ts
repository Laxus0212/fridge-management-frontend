import { Component } from '@angular/core';
import {NavigationEnd, Router} from "@angular/router";
import {filter} from "rxjs";
import {RoutePaths} from "./enums/route-paths";
import {AuthService} from './services/auth.service';
import {CacheService} from './services/cache.service';
import {NotificationService} from './services/notification.service';
import {Preferences} from '@capacitor/preferences';
import {Platform} from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  showUserBar: boolean = true;

  constructor(
    public readonly router: Router,
    private readonly authService: AuthService,
    private cacheService: CacheService,
    private notificationService: NotificationService,
    private platform: Platform,
    ) {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.checkIfUserBarShouldBeDisplayed(event.urlAfterRedirects);
    });

    void this.initializeApp();
  }

  async initializeApp() {
    if (this.authService.isLoggedIn()) {
      const userId = this.authService.getUserId();
      const familyId = this.authService.getUserFamilyId();

      console.log('Auto-login detected, full loading cache...');
      this.cacheService.clearCache();
      this.cacheService.fullLoad(userId, familyId);

      await this.platform.ready();

      const result = await Preferences.get({key: 'notificationSettings'});
      if (result.value) {
        const settings = JSON.parse(result.value);
        if (settings.enabled) {
          await this.notificationService.initializeNotifications(settings.onlyIfNewItems, settings.notificationTime);
        }
      }
    }
  }


  checkIfUserBarShouldBeDisplayed(url: string) {
    const urlWithoutSlash = url.slice(1);
    // Elrejtjük a UserBar-t, ha a felhasználó a bejelentkezés vagy regisztráció oldalon van
    const hideUserBarPaths = [RoutePaths.Login, RoutePaths.Register, RoutePaths.Home];
    this.showUserBar = !hideUserBarPaths.includes(<RoutePaths>urlWithoutSlash);
  }
}
