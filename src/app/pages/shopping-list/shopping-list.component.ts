import {Component, OnInit} from '@angular/core';
import {Product, ShoppingList, ShoppingListItem, ShoppingListService} from '../../openapi/generated-src';
import {AuthService} from '../../services/auth.service';
import {CommonService} from '../../services/common.service';
import {ToastController} from '@ionic/angular';
import UnitEnum = Product.UnitEnum;

@Component({
  selector: 'app-shopping-list',
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.scss'],
})
export class ShoppingListComponent implements OnInit {
  shoppingLists: ShoppingList[] = [];
  filteredShoppingLists: ShoppingList[] = [];
  userId?: number;
  userFamilyId?: number;
  newShoppingListName: string = '';
  newShoppingListSharedWithFamily: boolean = false;
  isModalOpen: boolean = false;
  isUpdateModalOpen: boolean = false;
  selectedShoppingList: ShoppingList | null = null;
  selectedShoppingListName: string = '';
  selectedShoppingListSharedWithFamily: boolean = false;
  filterOption: 'owned' | 'family' = 'owned';
  isLoading = true;

  editProductName: string = '';
  editProductQuantity: number | null = null;
  editProductUnit?: UnitEnum;
  currentEditingProductId: number | null = null;


  currentEditingShoppingListId: number | null = null;
  newProductName: string = '';
  newProductQuantity: number | null = null;
  newProductUnit: UnitEnum | undefined;
  isAddProductModalOpen: boolean = false;
  public isExpanded: { [listId: number]: boolean } = {};
  public selectedProduct?: ShoppingListItem;
  public isEditProductModalOpen: boolean = false;

  constructor(
    private shoppingListService: ShoppingListService,
    public authService: AuthService,
    private commonService: CommonService,
    private toastController: ToastController
  ) {
  }

  ngOnInit() {
    const uId = this.authService.getUserId();
    this.userId = uId ? uId : undefined;
    const fId = this.authService.getUserFamilyId();
    this.userFamilyId = fId ? fId : undefined;
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
    if (this.userId) {
      this.isLoading = true;
      this.shoppingListService.getShoppingListsByUserId(this.userId).subscribe({
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
    }else {
      void this.commonService.presentToast('Failed to load user', 'danger');
    }
  }

  applyFilter() {
    if (this.filterOption === 'owned') {
      this.filteredShoppingLists = this.shoppingLists;
    } else {
      this.filteredShoppingLists = this.shoppingLists.filter(list => list.familyId);
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
      ownerId: this.userId,
      familyId: this.newShoppingListSharedWithFamily ? this.userFamilyId : undefined,
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
    this.selectedShoppingListSharedWithFamily = !!shoppingList.familyId;
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
      familyId: this.selectedShoppingListSharedWithFamily ? this.userFamilyId : undefined,
    };

    this.shoppingListService.updateShoppingList(this.selectedShoppingList.listId!, updatedList).subscribe({
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
    this.newProductUnit = undefined;
  }

  addProductToShoppingList() {
    if (this.currentEditingShoppingListId && this.newProductName && this.newProductQuantity && this.newProductUnit) {
      const newProduct: ShoppingListItem = {
        productName: this.newProductName,
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

  // Modal ablak megnyitása a termék szerkesztéséhez
  openEditProductModal(product: ShoppingListItem, listId: number) {
    if (!product.productName || !product.quantity || !product.unit) {
      return;
    }
    this.editProductName = product.productName;
    this.editProductQuantity = product.quantity;
    this.editProductUnit = product.unit;
    this.currentEditingShoppingListId = listId;
    this.currentEditingProductId = product.itemId!;
    this.isEditProductModalOpen = true;
  }

  // Modal ablak bezárása
  closeEditProductModal() {
    this.isEditProductModalOpen = false;
    this.editProductName = '';
    this.editProductQuantity = null;
    this.editProductUnit = undefined;
    this.currentEditingShoppingListId = null;
    this.currentEditingProductId = null;
  }

  // Termék frissítése
  updateProduct() {
    if (
      this.currentEditingShoppingListId &&
      this.currentEditingProductId &&
      this.editProductName &&
      this.editProductQuantity !== null &&
      this.editProductUnit
    ) {
      const updatedProduct: ShoppingListItem = {
        itemId: this.currentEditingProductId,
        listId: this.currentEditingShoppingListId,
        productName: this.editProductName,
        quantity: this.editProductQuantity,
        unit: this.editProductUnit,
      };

      this.shoppingListService
        .updateShoppingListItem(this.currentEditingShoppingListId, this.currentEditingProductId, updatedProduct)
        .subscribe({
          next: () => {
            this.closeEditProductModal();
            this.loadShoppingLists(); // Frissíti a bevásárlólistákat
            void this.presentToast('Product updated successfully', 'success');
          },
          error: (error) => {
            console.error('Failed to update product:', error);
            void this.presentToast('Failed to update product', 'danger');
          },
        });
    }
  }

  public hasSelectedProduct(): boolean {
    return !!this.selectedProduct;
  }

  protected readonly ShoppingListItem = ShoppingListItem;
}
