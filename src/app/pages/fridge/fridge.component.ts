import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {CommonService} from "../../services/common.service";
import {ActivatedRoute, Router} from "@angular/router";
import {RoutePaths} from "../../enums/route-paths";
import {Fridge, FridgeService, UpdateFridgeReq, UserService} from '../../openapi/generated-src';

@Component({
  selector: 'app-fridge',
  templateUrl: './fridge.component.html',
  styleUrls: ['./fridge.component.scss'],
})
export class FridgeComponent implements OnInit {
  fridges: Fridge[] = [];
  filteredFridges: Fridge[] = [];
  userId?: number;
  userFamilyId?: number;
  newFridgeName: string = '';
  newFridgeSharedWithFamily: boolean = false;
  isModalOpen: boolean = false;
  isUpdateModalOpen: boolean = false;
  selectedFridge: Fridge | null = null;
  selectedFridgeName: string = '';
  selectedFridgeSharedWithFamily: boolean = false;
  filterOption: 'owned' | 'family' = 'owned';
  isOwner: boolean = false; // Add this property
  isLoading = true; // Add this line


  constructor(
    protected fridgeService: FridgeService,
    private userService: UserService,
    private authService: AuthService,
    private commonService: CommonService,
    private router: Router,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit() {
    const uId = this.authService.getUserId();
    this.userId = uId ? uId : undefined;
    const fId = this.authService.getUserFamilyId();
    this.userFamilyId = fId ? fId : undefined;
    this.loadFridges();
  }

  loadFridges() {
    if (this.userId) {
      this.isLoading = true; // Set loading to true while fridges are being loaded
      this.fridgeService.getUserFridges(this.userId).subscribe({
        next: (fridges: Fridge[]) => {
          this.fridges = fridges;
        },
        error: (error) => {
          console.error('Failed to load fridges:', error);
          this.isLoading = false; // Set loading to false in case of error
        },
        complete: () => {
          if (this.userFamilyId) {
            this.fridgeService.getFamilyFridges(this.userFamilyId).subscribe({
              next: (familyFridges: Fridge[]) => {
                this.fridges
                  .concat(
                    familyFridges
                      .filter(fridge =>
                        !this.fridges
                          .some(ownedFridge =>
                            ownedFridge.fridgeId === fridge.fridgeId
                          )
                      )
                  );
                this.applyFilter();
                this.isLoading = false; // Set loading to false after fridges are loaded
              },
              error: (error) => {
                console.error('Failed to load family fridges:', error);
                this.isLoading = false; // Set loading to false in case of error
              },
              complete: () => {
                console.log(this.fridges);
              }
            });
          }
          this.applyFilter();
          this.isLoading = false; // Set loading to false after fridges are loaded
          if (this.fridges.length === 0) {
            void this.commonService.presentToast('You have no fridges yet. Click the + button to add one!', 'warning');
          }
          console.log(this.fridges);
        }
      });
    } else {
      void this.commonService.presentToast('User not found', 'danger');
    }
  }

  applyFilter() {
    if (this.filterOption === 'owned') {
      this.filteredFridges = this.fridges.filter(fridge => fridge.ownerId === this.userId);
    } else if (this.filterOption === 'family' && this.userFamilyId) {
      this.filteredFridges = this.fridges.filter(
        fridge => fridge.familyId && fridge.ownerId && this.userFamilyId
      );
    } else {
      this.filteredFridges = [];
    }
  }

  openAddFridgeModal() {
    this.isOwner = true; // Set isOwner to true for adding a fridge
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
        familyId: this.userFamilyId
      };

      this.fridgeService.addFridge(newFridge).subscribe({
        next: () => {
          this.loadFridges();
          this.newFridgeName = '';
          this.newFridgeSharedWithFamily = false;
          void this.commonService.presentToast('Fridge added successfully!', 'success');
        },
        error: (error) => {
          console.error('Failed to add fridge:', error);
          void this.commonService.presentToast(error.message, 'danger');
        },
        complete: () => {
          this.isModalOpen = false;
        }
      });
    } else {
      void this.commonService.presentToast('User not found', 'danger');
    }
  }

  openUpdateFridgeModal(fridge: Fridge) {
    this.selectedFridge = fridge;
    this.selectedFridgeName = fridge.fridgeName;
    this.selectedFridgeSharedWithFamily = !!fridge.familyId ?? false;
    this.isOwner = fridge.ownerId === this.userId; // Check if the current user is the owner
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
      const updateFridgeFamily = this.selectedFridgeSharedWithFamily ? this.userFamilyId : undefined;
      const updatedFridge: UpdateFridgeReq = {
        fridgeId: this.selectedFridge.fridgeId,
        fridgeName: this.selectedFridgeName,
        familyId: updateFridgeFamily
      };

      this.fridgeService.updateFridge(updatedFridge.fridgeId!, updatedFridge).subscribe({
        next: () => {
          this.loadFridges();
          void this.commonService.presentToast('Fridge updated successfully!', 'success');
        },
        error: (error) => {
          console.error('Failed to update fridge:', error);
          void this.commonService.presentToast(error.message, 'danger');
        },
        complete: () => {
          this.closeUpdateFridgeModal();
        }
      });
    } else {
      void this.commonService.presentToast('User not found', 'danger');
    }
  }

  deleteFridge(fridgeId: number | undefined) {
    if (!fridgeId) return;

    this.fridgeService.deleteFridge(fridgeId).subscribe({
      next: () => {
        this.loadFridges();
        void this.commonService.presentToast('Fridge deleted successfully!', 'success');
      },
      error: (error) => {
        console.error('Failed to delete fridge:', error);
        void this.commonService.presentToast(error.message, 'danger');
      }
    });
  }

  navigateToShelf(fridgeId: number) {
    sessionStorage.setItem('selectedFridgeId', fridgeId.toString());
    this.commonService.setFridgeName(this.fridges.find(fridge => fridge.fridgeId === fridgeId)?.fridgeName || '');
    this.commonService.navigateToPage(RoutePaths.Shelf, this.route);
  }
}
