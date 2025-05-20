import { Injectable } from '@angular/core';
import {ToastController} from "@ionic/angular";
import {ActivatedRoute, Router} from "@angular/router";
import {RoutePaths} from "../enums/route-paths";

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  shelfName = '';
  private _shelfId = -1;
  selectedFridgeName = '';
  private _selectedFridgeId = -1;
  familyName = '';
  private _familyId = -1;

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

  getShelfName() {
    return this.shelfName;
  }

  setFridgeName(name: string) {
    this.selectedFridgeName = name;
  }

  get shelfId(): number {
    return this._shelfId;
  }

  set shelfId(value: number) {
    this._shelfId = value;
  }

  get selectedFridgeId(): number {
    return this._selectedFridgeId;
  }

  set selectedFridgeId(value: number) {
    this._selectedFridgeId = value;
  }

  get familyId(): number {
    return this._familyId;
  }

  set familyId(value: number) {
    this._familyId = value;
  }

  clearUserData() {
    this.shelfName = '';
    this._shelfId = -1;
    this.selectedFridgeName = '';
    this._selectedFridgeId = -1;
    this.familyName = '';
    this._familyId = -1;
  }
}
