import {Component, OnInit} from '@angular/core';
import {Shelf, ShelfService} from "../../openapi/generated-angular-sdk";
import {CommonService} from "../../services/common.service";
import {RoutePaths} from "../../enums/route-paths";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-shelf',
  templateUrl: './shelf.component.html',
  styleUrls: ['./shelf.component.scss'],
})
export class ShelfComponent implements OnInit {
  shelves: Shelf[] = [];
  newShelfName: string = '';
  selectedShelfName: string = '';
  selectedShelf: Shelf | null = null;
  isAddModalOpen: boolean = false;
  isUpdateModalOpen: boolean = false;
  fridgeId: number | undefined; // Initialize with 0 or any default value

  constructor(
    private shelfService: ShelfService,
    public commonService: CommonService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.loadShelves();
    this.fridgeId = Number.parseInt(sessionStorage.getItem('selectedFridgeId') ?? ''); // Get the fridgeId from the session storage
  }

  // Load shelves
  loadShelves() {
    this.shelfService.getShelves().subscribe({
      next: (shelves: Shelf[]) => {
        this.shelves = shelves.filter(shelf => shelf.fridge_id === this.fridgeId);
      },
      error: (error) => {
        console.error('Failed to load shelves:', error);
        void this.commonService.presentToast(error.error.message, 'danger');
      }
    });
  }

  // Open add shelf modal
  openAddShelfModal() {
    this.isAddModalOpen = true;
  }

  // Close add shelf modal
  closeAddShelfModal() {
    this.isAddModalOpen = false;
    this.newShelfName = '';
  }

  // Add a new shelf
  addShelf() {
    if (!this.newShelfName || !this.fridgeId) return;

    const newShelf: Shelf = {
      name: this.newShelfName,
      fridge_id: this.fridgeId
    };

    this.shelfService.createShelf(newShelf).subscribe({
      next: () => {
        this.loadShelves();
        this.closeAddShelfModal();
        void this.commonService.presentToast('Shelf added successfully!', 'success');
      },
      error: (error) => {
        console.error('Failed to add shelf:', error);
        void this.commonService.presentToast(error.error.message, 'danger');
      }
    });
  }

  // Open update shelf modal
  openUpdateShelfModal(shelf: Shelf) {
    this.selectedShelf = shelf;
    this.selectedShelfName = shelf.name;
    this.isUpdateModalOpen = true;
  }

  // Close update shelf modal
  closeUpdateShelfModal() {
    this.isUpdateModalOpen = false;
    this.selectedShelf = null;
    this.selectedShelfName = '';
  }

  // Update shelf name
  updateShelf() {
    if (!this.selectedShelf || !this.selectedShelfName) return;

    const updatedShelf: Shelf = { ...this.selectedShelf, name: this.selectedShelfName };

    this.shelfService.updateShelfById(this.selectedShelf.id!, updatedShelf).subscribe({
      next: () => {
        this.loadShelves();
        this.closeUpdateShelfModal();
        void this.commonService.presentToast('Shelf updated successfully!', 'success');
      },
      error: (error) => {
        console.error('Failed to update shelf:', error);
        void this.commonService.presentToast(error.error.message, 'danger');
      }
    });
  }

  // Delete a shelf
  deleteShelf(id: number | undefined) {
    if (!id) return;

    this.shelfService.deleteShelfById(id).subscribe({
      next: () => {
        this.loadShelves();
        void this.commonService.presentToast('Shelf deleted successfully!', 'success');
      },
      error: (error) => {
        console.error('Failed to delete shelf:', error);
        void this.commonService.presentToast(error.message, 'danger');
      }
    });
  }

  navigateToProductPage(shelfId: number) {
    sessionStorage.removeItem('selectedShelfId');
    sessionStorage.setItem('selectedShelfId', shelfId.toString());
    this.commonService.setShelfName(this.shelves.find(shelf => shelf.id === shelfId)?.name ?? '');
    this.commonService.navigateToPage(RoutePaths.ShelfProduct, this.route);
  }
}
