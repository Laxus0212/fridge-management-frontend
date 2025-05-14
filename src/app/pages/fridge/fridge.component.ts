import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonService } from '../../services/common.service';
import { ActivatedRoute, Router } from '@angular/router';
import { RoutePaths } from '../../enums/route-paths';
import {Fridge, UpdateFridgeReq} from '../../openapi/generated-src';
import { CacheService } from '../../services/cache.service';
import {AbstractPage} from '../abstract-page';
import {map, Observable, tap} from 'rxjs';

@Component({
  selector: 'app-fridge',
  templateUrl: './fridge.component.html',
  styleUrls: ['./fridge.component.scss'],
})
export class FridgeComponent extends AbstractPage implements OnInit {
  fridges: Fridge[] = [];
  filteredFridges: Fridge[] = [];
  fridges$: Observable<Fridge[]> = this.cacheService.getFridges();
  filteredFridges$: Observable<Fridge[]>;
  newFridgeName: string = '';
  newFridgeSharedWithFamily: boolean = false;
  isModalOpen: boolean = false;
  isUpdateModalOpen: boolean = false;
  selectedFridge: Fridge | null = null;
  selectedFridgeName: string = '';
  selectedFridgeSharedWithFamily: boolean = false;
  filterOption: 'owned' | 'family' = 'owned';
  isOwner: boolean = false;
  isLoading = true;

  constructor(
    authService: AuthService,
    commonService: CommonService,
    private router: Router,
    private route: ActivatedRoute,
    cacheService: CacheService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    super(authService, cacheService, commonService);
    console.log('FridgeComponent constructor called');

    this.filteredFridges$ = this.fridges$.pipe(
      tap(fridges => {
        if (fridges.length === 0) {
          void this.commonService.presentToast('You have no fridges yet. Click the + button to add one!', 'warning');
        }
      }),
      map(fridges => this.applyFilter(fridges))
    );
  }

  override ngOnInit() {
    super.ngOnInit();
    console.log('FridgeComponent ngOnInit called');
    this.authService.userId$.subscribe(userId => {
      this.userId = userId;
      //this.loadFridges();
    });

    this.authService.userFamilyId$.subscribe(familyId => {
      this.familyId = familyId;
      //this.loadFridges();
    });
    this.cacheService.isLoading$.subscribe(isLoading => this.isLoading = isLoading);
    //this.loadFridges();
  }

  reloadFridges() {
    if (this.userId) {
      this.cacheService.loadFridges(this.userId, this.familyId);
      void this.commonService.presentToast('Fridges reloaded!', 'success');
    } else {
      void this.commonService.presentToast('User not found', 'danger');
    }
  }


  // loadFridges() {
  //   this.cacheService.loadFridges(this.userId, this.familyId);
  //   this.cacheService.getFridges().subscribe(
  //     {
  //       next: fridges => {
  //         this.fridges = fridges;
  //         this.applyFilter();
  //         //this.changeDetectorRef.detectChanges();
  //         if (this.fridges.length === 0) {
  //           void this.commonService.presentToast('You have no fridges yet. Click the + button to add one!', 'warning');
  //         }
  //       },
  //       error: (e) => this.commonService.presentToast('Failed to load fridges', e),
  //     }
  //     );
  // }

  // applyFilter() {
  //   if (this.filterOption === 'owned') {
  //     this.filteredFridges = this.fridges.filter(fridge => fridge.ownerId === this.userId);
  //   } else if (this.filterOption === 'family' && this.familyId) {
  //     this.filteredFridges = this.fridges.filter(
  //       fridge => fridge.familyId && fridge.ownerId && this.familyId
  //     );
  //   } else {
  //     this.filteredFridges = [];
  //   }
  // }

  private applyFilter(fridges: Fridge[]): Fridge[] {
    if (this.filterOption === 'owned') {
      return fridges.filter(f => f.ownerId === this.userId);
    } else if (this.filterOption === 'family' && this.familyId) {
      return fridges.filter(f => f.familyId === this.familyId);
    } else {
      return [];
    }
  }

  onFilterChange() {
    // Új filter kiválasztáskor új stream generálása
    this.filteredFridges$ = this.fridges$.pipe(
      map(fridges => this.applyFilter(fridges))
    );
  }

  openAddFridgeModal() {
    this.isOwner = true;
    this.isModalOpen = true;
  }

  closeAddFridgeModal() {
    this.isModalOpen = false;
    this.newFridgeName = '';
    this.newFridgeSharedWithFamily = false;
  }

  addFridge() {
    if (!this.newFridgeName) return;

    if (this.userId) {
      const newFridge: Fridge = {
        fridgeName: this.newFridgeName,
        ownerId: this.userId,
        familyId: this.newFridgeSharedWithFamily ? this.familyId! : undefined
      };

      this.cacheService.addFridge(newFridge, this.userId, this.familyId);
      this.newFridgeName = '';
      this.newFridgeSharedWithFamily = false;
      this.isModalOpen = false;
      void this.commonService.presentToast('Fridge added successfully!', 'success');
    } else {
      void this.commonService.presentToast('User not found', 'danger');
    }
  }

  openUpdateFridgeModal(fridge: Fridge) {
    this.selectedFridge = fridge;
    this.selectedFridgeName = fridge.fridgeName;
    this.selectedFridgeSharedWithFamily = !!fridge.familyId ?? false;
    this.isOwner = fridge.ownerId === this.userId;
    this.isUpdateModalOpen = true;
  }

  closeUpdateFridgeModal() {
    this.isUpdateModalOpen = false;
    this.selectedFridge = null;
    this.selectedFridgeName = '';
    this.selectedFridgeSharedWithFamily = false;
  }

  updateFridge() {
    if (!this.selectedFridge || !this.selectedFridgeName) return;

    if (this.selectedFridge.fridgeId) {
      const updateFridgeFamily = this.selectedFridgeSharedWithFamily ? this.familyId : undefined;
      const updatedFridge: UpdateFridgeReq = {
        fridgeId: this.selectedFridge.fridgeId,
        fridgeName: this.selectedFridgeName,
        familyId: updateFridgeFamily!
      };

      this.cacheService.updateFridge(updatedFridge.fridgeId, updatedFridge, this.userId, this.familyId);
      this.closeUpdateFridgeModal();
      void this.commonService.presentToast('Fridge updated successfully!', 'success');
    } else {
      void this.commonService.presentToast('User not found', 'danger');
    }
  }

  deleteFridge(fridgeId: number | undefined) {
    if (!fridgeId) return;

    this.cacheService.deleteFridge(fridgeId, this.userId, this.familyId);
    void this.commonService.presentToast('Fridge deleted successfully!', 'success');
  }

  navigateToShelf(fridgeId: number) {
    sessionStorage.setItem('selectedFridgeId', fridgeId.toString());
    this.commonService.setFridgeName(this.fridges.find(fridge => fridge.fridgeId === fridgeId)?.fridgeName || '');
    this.commonService.navigateToPage(RoutePaths.Shelf, this.route);
  }
}
