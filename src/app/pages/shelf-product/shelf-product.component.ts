import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../services/common.service';
import {Product, ProductService} from '../../openapi/generated-src';

@Component({
  selector: 'app-shelf-product',
  templateUrl: './shelf-product.component.html',
  styleUrls: ['./shelf-product.component.scss']
})
export class ShelfProductComponent implements OnInit {
  //NEM HASZNÁLT KOMPONENS
  //NEM HASZNÁLT KOMPONENS
  //NEM HASZNÁLT KOMPONENS
  //NEM HASZNÁLT KOMPONENS
  //NEM HASZNÁLT KOMPONENS
  //NEM HASZNÁLT KOMPONENS
  //NEM HASZNÁLT KOMPONENS
  //NEM HASZNÁLT KOMPONENS
  //NEM HASZNÁLT KOMPONENS
  //NEM HASZNÁLT KOMPONENS
  //NEM HASZNÁLT KOMPONENS
  //NEM HASZNÁLT KOMPONENS
  //NEM HASZNÁLT KOMPONENS
  //NEM HASZNÁLT KOMPONENS
  //NEM HASZNÁLT KOMPONENS
  products: Product[] = []; // ShelfProduct helyett Product típusú tömb
  newProductName: string = '';
  newProductQuantity: number | null = null;
  newProductUnit: Product.UnitEnum | null = null; // Product.UnitEnum használata
  newProductExpirationDate: string = new Date().toISOString();
  shelfId: number | undefined;
  isAddModalOpen: boolean = false;

  constructor(
    private productService: ProductService, // ShelfProductService helyett ProductService
    protected commonService: CommonService
  ) {}

  ngOnInit() {
    this.shelfId = Number.parseInt(sessionStorage.getItem('selectedShelfId') || '-1');
    this.loadShelfProducts();
  }

  // Load all shelf products for the selected shelf
  loadShelfProducts() {
    this.productService.getProductsByShelfId(this.shelfId!).subscribe({
      next: (products: Product[]) => {
        this.products = products;
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
    if (!this.newProductName || !this.newProductQuantity || !this.newProductUnit || !this.newProductExpirationDate || !this.shelfId) {
      return;
    }

    const newProduct: Product = {
      productName: this.newProductName,
      shelfId: this.shelfId,
      quantity: this.newProductQuantity,
      unit: this.newProductUnit,
      expirationDate: this.newProductExpirationDate,
    };

    this.productService.addProduct(newProduct).subscribe({
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
  }

  // Delete a product from the shelf
  deleteShelfProduct(productId: number) {
    this.productService.deleteProduct(productId).subscribe({
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
