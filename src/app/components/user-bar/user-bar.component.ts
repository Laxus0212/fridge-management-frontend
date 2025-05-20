import { Component, OnInit } from '@angular/core';
import {AuthService} from "../../services/auth.service";
import {Router} from "@angular/router";
import {RoutePaths} from "../../enums/route-paths";

@Component({
  selector: 'app-user-bar',
  templateUrl: './user-bar.component.html',
  styleUrls: ['./user-bar.component.scss'],
})
export class UserBarComponent  implements OnInit {
  username: string = '';

  constructor(
    private authService: AuthService,
    public readonly router: Router,
  ) {}

  ngOnInit() {
    this.username = this.authService.getUsername();
  }
}
