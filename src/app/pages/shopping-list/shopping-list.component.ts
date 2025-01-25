import { Component, OnInit } from '@angular/core';
import {ShoppingList, ShoppingListItem, ShoppingListService} from '../../openapi/generated-src';
import { AuthService } from '../../services/auth.service';
import { CommonService } from '../../services/common.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-shopping-list',
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.scss'],
})
export class ShoppingListComponent implements OnInit {
  shoppingLists: ShoppingList[] = [];
  filteredShoppingLists: ShoppingList[] = [];
  userId: number = 0;
  userFamilyId: number = 0;
  newShoppingListName: string = '';
  newShoppingListSharedWithFamily: boolean = false;
  isModalOpen: boolean = false;
  isUpdateModalOpen: boolean = false;
  selectedShoppingList: ShoppingList | null = null;
  selectedShoppingListName: string = '';
  selectedShoppingListSharedWithFamily: boolean = false;
  filterOption: 'owned' | 'family' = 'owned';
  isLoading = true;

  constructor(
    private shoppingListService: ShoppingListService,
    private authService: AuthService,
    private commonService: CommonService,
    private toastController: ToastController
  ) {
  }

  ngOnInit() {
    this.userId = this.authService.getUserId();
    this.userFamilyId = this.authService.getUserFamilyId();
    this.loadShoppingLists();
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top',
    });
    await toast.present();
  }
  loadShoppingLists() {
    this.isLoading = true;
    this.shoppingListService.getShoppingListsByFamilyId(this.userFamilyId).subscribe({
      next: (lists: ShoppingList[]) => {
        this.shoppingLists = lists;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load shopping lists:', error);
        this.isLoading = false;
        void this.presentToast('Failed to load shopping lists', 'danger');
      },
    });
  }

  applyFilter() {
    if (this.filterOption === 'owned') {
      this.filteredShoppingLists = this.shoppingLists.filter(list => !list.family_id);
    } else if (this.filterOption === 'family') {
      this.filteredShoppingLists = this.shoppingLists.filter(list => list.family_id);
    } else {
      this.filteredShoppingLists = [];
    }
  }
  openAddShoppingListModal() {
    this.isModalOpen = true;
  }

  closeAddShoppingListModal() {
    this.isModalOpen = false;
    this.newShoppingListName = '';
    this.newShoppingListSharedWithFamily = false;
  }

  addShoppingList() {
    if (!this.newShoppingListName) return;

    const newList: ShoppingList = {
      name: this.newShoppingListName,
      family_id: this.newShoppingListSharedWithFamily ? this.userFamilyId : undefined,
    };

    this.shoppingListService.createShoppingList(newList).subscribe({
      next: () => {
        this.loadShoppingLists();
        this.closeAddShoppingListModal();
        void this.presentToast('Shopping list added successfully', 'success');
      },
      error: (error) => {
        console.error('Failed to add shopping list:', error);
        void this.presentToast('Failed to add shopping list', 'danger');
      },
    });
  }
  openEditShoppingListModal(shoppingList: ShoppingList) {
    this.selectedShoppingList = shoppingList;
    this.selectedShoppingListName = shoppingList.name || '';
    this.selectedShoppingListSharedWithFamily = !!shoppingList.family_id;
    this.isUpdateModalOpen = true;
  }

  closeEditShoppingListModal() {
    this.isUpdateModalOpen = false;
    this.selectedShoppingList = null;
    this.selectedShoppingListName = '';
    this.selectedShoppingListSharedWithFamily = false;
  }

  updateShoppingList() {
    if (!this.selectedShoppingList || !this.selectedShoppingListName) return;

    const updatedList: ShoppingList = {
      ...this.selectedShoppingList,
      name: this.selectedShoppingListName,
      family_id: this.selectedShoppingListSharedWithFamily ? this.userFamilyId : undefined,
    };

    this.shoppingListService.updateShoppingList(this.selectedShoppingList.list_id!, updatedList).subscribe({
      next: () => {
        this.loadShoppingLists();
        this.closeEditShoppingListModal();
        void this.presentToast('Shopping list updated successfully', 'success');
      },
      error: (error) => {
        console.error('Failed to update shopping list:', error);
        void this.presentToast('Failed to update shopping list', 'danger');
      },
    });
  }
  deleteShoppingList(listId: number) {
    this.shoppingListService.deleteShoppingList(listId).subscribe({
      next: () => {
        this.loadShoppingLists();
        void this.presentToast('Shopping list deleted successfully', 'success');
      },
      error: (error) => {
        console.error('Failed to delete shopping list:', error);
        void this.presentToast('Failed to delete shopping list', 'danger');
      },
    });
  }
  openAddProductModal(listId: number) {
    this.currentEditingShoppingListId = listId;
    this.isAddProductModalOpen = true;
  }

  closeAddProductModal() {
    this.isAddProductModalOpen = false;
    this.newProductName = '';
    this.newProductQuantity = null;
    this.newProductUnit = '';
  }

  addProductToShoppingList() {
    if (this.currentEditingShoppingListId && this.newProductName && this.newProductQuantity && this.newProductUnit) {
      const newProduct: ShoppingListItem = {
        product_name: this.newProductName,
        quantity: this.newProductQuantity,
        unit: this.newProductUnit,
      };

      this.shoppingListService.addItemToShoppingList(this.currentEditingShoppingListId, newProduct).subscribe({
        next: () => {
          this.loadShoppingLists();
          this.closeAddProductModal();
          void this.presentToast('Product added successfully', 'success');
        },
        error: (error) => {
          console.error('Failed to add product:', error);
          void this.presentToast('Failed to add product', 'danger');
        },
      });
    }
  }

  deleteProduct(listId: number, itemId: number) {
    this.shoppingListService.deleteShoppingListItem(listId, itemId).subscribe({
      next: () => {
        this.loadShoppingLists();
        void this.presentToast('Product deleted successfully', 'success');
      },
      error: (error) => {
        console.error('Failed to delete product:', error);
        void this.presentToast('Failed to delete product', 'danger');
      },
    });
  }
}
