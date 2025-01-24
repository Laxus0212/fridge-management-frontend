import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonService } from "../../services/common.service";
import { ActivatedRoute, Router } from "@angular/router";
import { RoutePaths } from "../../enums/route-paths";
import { Fridge, FridgeService, UserService } from '../../openapi/generated-src';

@Component({
  selector: 'app-fridge',
  templateUrl: './fridge.component.html',
  styleUrls: ['./fridge.component.scss'],
})
export class FridgeComponent implements OnInit {
  fridges: Fridge[] = [];
  filteredFridges: Fridge[] = [];
  userId: number = 0;
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
  ) {}

  ngOnInit() {
    this.userId = this.authService.getUserId();
    this.userFamilyId = this.authService.getUserFamilyId();
    this.loadFridges();
  }

  loadFridges() {
    this.isLoading = true; // Set loading to true while fridges are being loaded
    this.userService.getUserFridges(this.userId).subscribe({
      next: (fridges: Fridge[]) => {
        this.fridges = fridges;
        this.applyFilter();
        this.isLoading = false; // Set loading to false after fridges are loaded
      },
      error: (error) => {
        console.error('Failed to load fridges:', error);
        this.isLoading = false; // Set loading to false in case of error
      },
      complete: () => {
        if (this.fridges.length === 0) {
          void this.commonService.presentToast('You have no fridges yet. Click the + button to add one!', 'warning');
        }
        console.log(this.fridges);
      }
    });
  }

  applyFilter() {
    if (this.filterOption === 'owned') {
      this.filteredFridges = this.fridges.filter(fridge => fridge.owner_id === this.userId);
    } else if (this.filterOption === 'family' && this.userFamilyId) {
      this.filteredFridges = this.fridges.filter(
        fridge => fridge.shared_with_family && fridge.owner_id && this.userFamilyId
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

    const newFridge: Fridge = {
      fridge_name: this.newFridgeName,
      owner_id: this.userId,
      shared_with_family: this.newFridgeSharedWithFamily
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
  }

  openUpdateFridgeModal(fridge: Fridge) {
    this.selectedFridge = fridge;
    this.selectedFridgeName = fridge.fridge_name;
    this.selectedFridgeSharedWithFamily = fridge.shared_with_family ?? false;
    this.isOwner = fridge.owner_id === this.userId; // Check if the current user is the owner
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

    const updatedFridge: Fridge = {
      ...this.selectedFridge,
      fridge_name: this.selectedFridgeName,
      shared_with_family: this.selectedFridgeSharedWithFamily
    };

    this.fridgeService.updateFridgeName(updatedFridge.fridge_id!, updatedFridge).subscribe({
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
    this.commonService.setFridgeName(this.fridges.find(fridge => fridge.fridge_id === fridgeId)?.fridge_name || '');
    this.commonService.navigateToPage(RoutePaths.Shelf, this.route);
  }
}
