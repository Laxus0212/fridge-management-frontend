import { Component, OnInit } from '@angular/core';
import {ActionSheetController} from "@ionic/angular";
import {AuthService} from "../../services/auth.service";
import {CommonService} from "../../services/common.service";
import {RoutePaths} from "../../enums/route-paths";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-menu-tabs',
  templateUrl: './menu-tabs.component.html',
  styleUrls: ['./menu-tabs.component.scss'],
})
export class MenuTabsComponent  implements OnInit {

  constructor(
    private actionSheetController: ActionSheetController,
    private authService: AuthService,
    private commonService: CommonService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {}

  async presentAccountActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Account',
      buttons: [
        {
          text: 'Account Settings',
          icon: 'settings',
          handler: () => {
            this.commonService.navigateToPage(RoutePaths.Account, this.route);
            console.log('Account Settings clicked');
          }
        },
        {
          text: 'Family',
          icon: 'people-circle-outline',
          handler: () => {
            this.commonService.navigateToPage(RoutePaths.Family, this.route);
            console.log('Family clicked');
          }
        },
        {
          text: 'Notifications',
          icon: 'notifications-outline',
          handler: () => {
            this.commonService.navigateToPage(RoutePaths.Notifications, this.route);
            console.log('Notifications clicked');
          }
        },
        {
          text: 'Logout',
          role: 'destructive',
          icon: 'log-out',
          handler: () => {
            this.authService.logout();
            console.log('Logout clicked');
          }
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });
    await actionSheet.present();
  }

}
