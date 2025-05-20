import {Component, OnInit} from '@angular/core';
import {Product, ShoppingList, ShoppingListItem, ShoppingListService} from '../../openapi/generated-src';
import {AuthService} from '../../services/auth.service';
import {CommonService} from '../../services/common.service';
import UnitEnum = Product.UnitEnum;
import {AbstractPage} from '../abstract-page';
import {CacheService} from '../../services/cache.service';
import {map, Observable, tap} from 'rxjs';
import {ActionSheetController} from '@ionic/angular';

@Component({
  selector: 'app-shopping-list',
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.scss'],
})
export class ShoppingListComponent extends AbstractPage implements OnInit {
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
  shoppingLists$: Observable<ShoppingList[]> = this.cacheService.getShoppingLists();
  filteredShoppingLists$: Observable<ShoppingList[]>;

  constructor(
    authService: AuthService,
    cacheService: CacheService,
    commonService: CommonService,
    private actionSheetController: ActionSheetController
  ) {
    super(authService, cacheService, commonService);

    this.filteredShoppingLists$ = this.shoppingLists$.pipe(
      tap(lists => {
        if (lists.length === 0) {
          void this.commonService.presentToast('No shopping lists yet. Click the + button to add one!', 'warning');
        }
      }),
      map(lists => this.applyFilter(lists))
    );
  }

  override ngOnInit() {
    super.ngOnInit();


    this.cacheService.isLoading$.subscribe(isLoading => this.isLoading = isLoading);
  }

  reloadShoppingLists() {
    if (this.userId) {
      this.cacheService.loadShoppingLists(this.userId);
      void this.commonService.presentToast('Shopping lists reloaded!', 'success');
    } else {
      void this.commonService.presentToast('User not found', 'danger');
    }
  }

  onFilterChange() {
    this.filteredShoppingLists$ = this.shoppingLists$.pipe(
      map(lists => this.applyFilter(lists))
    );
  }

  private applyFilter(lists: ShoppingList[]): ShoppingList[] {
    if (this.filterOption === 'owned') {
      return lists.filter(l => l.ownerId === this.userId);
    } else if (this.filterOption === 'family' && this.familyId) {
      return lists.filter(l => l.familyId === this.familyId);
    } else {
      return [];
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
    if (!this.newShoppingListName) {
      void this.commonService.presentToast('List name is required', 'warning');
      return;
    }

    const newList: ShoppingList = {
      name: this.newShoppingListName,
      ownerId: this.userId ?? undefined,
      familyId: this.newShoppingListSharedWithFamily ? this.familyId ?? undefined : undefined,
    };

    this.cacheService.addShoppingList(newList, this.userId).subscribe({
      next: () => {
        this.closeAddShoppingListModal();
        void this.commonService.presentToast('Shopping list added successfully!', 'success');
      },
      error: (error) => {
        void this.commonService.presentToast('Failed to add shopping list: ' + (error?.error?.message || 'Unknown error'), 'danger');
      }
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
    if (!this.selectedShoppingList || !this.selectedShoppingListName) {
      void this.commonService.presentToast('List name is required', 'warning');
      return;
    }

    const updatedList: ShoppingList = {
      ...this.selectedShoppingList,
      name: this.selectedShoppingListName,
      familyId: this.selectedShoppingListSharedWithFamily ? this.familyId ?? undefined : undefined
    };

    this.cacheService.updateShoppingList(this.selectedShoppingList.listId!, updatedList, this.userId).subscribe({
      next: () => {
        this.closeEditShoppingListModal();
        void this.commonService.presentToast('Shopping list updated successfully!', 'success');
      },
      error: (error) => {
        void this.commonService.presentToast('Failed to update shopping list: ' + (error?.error?.message || 'Unknown error'), 'danger');
      }
    });
  }

  deleteShoppingList(listId: number) {
    if (!listId) return;

    this.cacheService.deleteShoppingList(listId, this.userId).subscribe({
      next: () => {
        void this.commonService.presentToast('Shopping list deleted successfully!', 'success');
      },
      error: (error) => {
        void this.commonService.presentToast('Failed to delete shopping list: ' + (error?.error?.message || 'Unknown error'), 'danger');
      }
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
    if (!this.currentEditingShoppingListId || !this.newProductName || !this.newProductQuantity || !this.newProductUnit) {
      void this.commonService.presentToast('All product fields are required', 'warning');
      return;
    }

    const newProduct: ShoppingListItem = {
      productName: this.newProductName,
      quantity: this.newProductQuantity,
      unit: this.newProductUnit,
    };

    this.cacheService.addItemToShoppingList(this.currentEditingShoppingListId, newProduct, this.userId).subscribe({
      next: () => {
        this.closeAddProductModal();
        void this.commonService.presentToast('Product added to shopping list!', 'success');
      },
      error: (error) => {
        void this.commonService.presentToast('Failed to add product: ' + (error?.error?.message || 'Unknown error'), 'danger');
      }
    });
  }

  deleteProduct(listId: number, itemId: number) {
    this.cacheService.deleteShoppingListItem(listId, itemId, this.userId).subscribe({
      next: () => {
        void this.commonService.presentToast('Product deleted successfully!', 'success');
      },
      error: (error) => {
        void this.commonService.presentToast('Failed to delete product: ' + (error?.error?.message || 'Unknown error'), 'danger');
      }
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

      this.cacheService.updateShoppingListItem(
        this.currentEditingShoppingListId,
        this.currentEditingProductId,
        updatedProduct,
        this.userId
      ).subscribe({
        next: () => {
          this.closeEditProductModal();
          void this.commonService.presentToast('Product updated successfully!', 'success');
        },
        error: (error) => {
          void this.commonService.presentToast('Failed to update product: ' + (error?.error?.message || 'Unknown error'), 'danger');
        }
      });
    } else {
      void this.commonService.presentToast('All fields are required', 'warning');
    }
  }

  async presentDeleteConfirmation(listId: number | undefined) {
    if (!listId) return;

    const actionSheet = await this.actionSheetController.create({
      header: 'Delete Shopping List',
      subHeader: 'Are you sure you want to delete this shopping list?',
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            this.deleteShoppingList(listId);
          },
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel',
          handler: () => {
            console.log('Delete cancelled');
          },
        },
      ],
    });

    await actionSheet.present();
  }

  protected readonly ShoppingListItem = ShoppingListItem;
}
