import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../services/common.service';
import { ShelfProduct, ShelfProductService } from "../../openapi/generated-angular-sdk";

@Component({
  selector: 'app-shelf-product',
  templateUrl: './shelf-product.component.html',
  styleUrls: ['./shelf-product.component.scss']
})
export class ShelfProductComponent implements OnInit {
  shelfProducts: ShelfProduct[] = [];
  newProductName: string = '';
  newProductQuantity: number | null = null;
  newProductUnit: ShelfProduct.UnitEnum | null = null;
  newProductExpirationDate: string = new Date().toISOString();
  newProductStatus: ShelfProduct.StatusEnum = 'unopened';
  shelfId: number | undefined;
  isAddModalOpen: boolean = false;

  constructor(
    private shelfProductService: ShelfProductService,
    protected commonService: CommonService
  ) {}

  ngOnInit() {
    this.shelfId = Number.parseInt(sessionStorage.getItem('selectedShelfId') || '-1');
    this.loadShelfProducts();
  }

  // Load all shelf products for the selected shelf
  loadShelfProducts() {
    this.shelfProductService.getShelfProducts().subscribe({
      next: (shelfProducts: ShelfProduct[]) => {
        this.shelfProducts = shelfProducts.filter(sp => sp.shelf_id === this.shelfId);
      },
      error: (error) => {
        console.error('Failed to load shelf products:', error);
        void this.commonService.presentToast(error.error.message, 'danger');
      }
    });
  }

  // Open add product modal
  openAddProductModal() {
    this.isAddModalOpen = true;
  }

  // Close add product modal
  closeAddProductModal() {
    this.isAddModalOpen = false;
    this.resetForm();
  }

  // Add a new product to the shelf
  addProductToShelf() {
    if (!this.newProductName || !this.newProductQuantity || !this.newProductUnit || !this.newProductExpirationDate || !this.newProductStatus || !this.shelfId) {
      return;
    }

    const newShelfProduct: ShelfProduct = {
      name: this.newProductName,
      shelf_id: this.shelfId,
      quantity: this.newProductQuantity,
      unit: this.newProductUnit,
      expiration_date: this.newProductExpirationDate,
      status: this.newProductStatus
    };

    this.shelfProductService.createShelfProduct(newShelfProduct).subscribe({
      next: () => {
        this.loadShelfProducts();
        this.closeAddProductModal();
        void this.commonService.presentToast('Product added to shelf successfully!', 'success');
      },
      error: (error) => {
        console.error('Failed to add product to shelf:', error);
        void this.commonService.presentToast(error.error.message, 'danger');
      }
    });
  }

  // Reset the form fields
  private resetForm() {
    this.newProductName = '';
    this.newProductQuantity = null;
    this.newProductUnit = null;
    this.newProductExpirationDate = new Date().toISOString();
    this.newProductStatus = 'unopened';
  }

  // Delete a product from the shelf
  deleteShelfProduct(shelfProductId: number) {
    this.shelfProductService.deleteShelfProductById(shelfProductId).subscribe({
      next: () => {
        this.loadShelfProducts();
        void this.commonService.presentToast('Product removed from shelf successfully!', 'success');
      },
      error: (error: { error: { message: string; }; }) => {
        console.error('Failed to delete shelf product:', error);
        void this.commonService.presentToast(error.error.message, 'danger');
      }
    });
  }
}
