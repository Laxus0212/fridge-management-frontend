import { Component } from '@angular/core';
import {NavigationEnd, Router} from "@angular/router";
import {filter} from "rxjs";
import {RoutePaths} from "./enums/route-paths";
import {AuthService} from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  showUserBar: boolean = true;

  constructor(
    public readonly router: Router,
    private readonly authService: AuthService
    ) {
    this.authService.setToken('mocktoken');
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.checkIfUserBarShouldBeDisplayed(event.urlAfterRedirects);
    });
  }

  checkIfUserBarShouldBeDisplayed(url: string) {
    const urlWithoutSlash = url.slice(1);
    // Elrejtjük a UserBar-t, ha a felhasználó a bejelentkezés vagy regisztráció oldalon van
    const hideUserBarPaths = [RoutePaths.Login, RoutePaths.Register, RoutePaths.Home];
    this.showUserBar = !hideUserBarPaths.includes(<RoutePaths>urlWithoutSlash);
  }
}
