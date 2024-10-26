import { Component, OnInit } from '@angular/core';
import { RoutePaths } from "../../enums/route-paths";
import { ActivatedRoute, Router } from "@angular/router";


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {

  constructor(
    public readonly router: Router,
    public readonly route: ActivatedRoute,
  ) { }

  ngOnInit() {}

  protected readonly RoutePaths = RoutePaths;

  navigateToNextPage(routePath: RoutePaths) {
    void this.router.navigate([routePath], { relativeTo: this.route.parent });
  }
}
