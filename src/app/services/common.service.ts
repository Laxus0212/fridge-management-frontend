import { Injectable } from '@angular/core';
import {ToastController} from "@ionic/angular";
import {ActivatedRoute, Router} from "@angular/router";
import {RoutePaths} from "../enums/route-paths";

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  shelfName = '';
  fridgeName = '';
  familyName = '';

  constructor(
    private toastController: ToastController,
    private router: Router,
  ) { }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top',
      buttons: [
        {
          side: 'end',
          icon: 'close',
          role: 'cancel',
        }
      ]
    });
    await toast.present();
  }

  navigateToPage(path: RoutePaths, activatedRoute: ActivatedRoute) {
    void this.router.navigate([path], {relativeTo: activatedRoute});
  }

  navigateRelativeToParent(path: RoutePaths, activatedRoute: ActivatedRoute) {
    void this.router.navigate([path], {relativeTo: activatedRoute.parent});
  }

  setShelfName(name: string) {
    this.shelfName = name;
  }

  getShelfName() {
    return this.shelfName;
  }

  setFridgeName(name: string) {
    this.fridgeName = name;
  }

  getFridgeName() {
    return this.fridgeName;
  }

  setFamilyName(name: string) {
    this.familyName = name;
  }

  getFamilyName() {
    return this.familyName;
  }
}
