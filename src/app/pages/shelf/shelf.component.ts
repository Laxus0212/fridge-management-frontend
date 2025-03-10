import {Component, OnInit} from '@angular/core';
import {CommonService} from '../../services/common.service';
import {RoutePaths} from '../../enums/route-paths';
import {ActivatedRoute} from '@angular/router';
import {Product, ProductService, Shelf, ShelfService} from 'src/app/openapi/generated-src';
import {BarcodeScanner} from '@capacitor-community/barcode-scanner';

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
  isAddProductModalOpen: boolean = false;
  isUpdateProductModalOpen: boolean = false;
  fridgeId: number | undefined;
  newProduct: Product = {
    productName: '',
    quantity: 0,
    unit: Product.UnitEnum.G,
    opened_date: '',
    expirationDate: '',
    shelfId: 0
  };
  selectedProduct: Product = {
    productName: '',
    quantity: 0,
    unit: Product.UnitEnum.G,
    opened_date: '',
    expirationDate: '',
    shelfId: 0
  };
  isLoading: boolean = false; // Add this line
  searchQuery: string = '';
  highlightedProducts: { [key: number]: boolean } = {};
  expandedShelfId: number | null = null;


  constructor(
    private shelfService: ShelfService,
    public commonService: CommonService,
    private route: ActivatedRoute,
    private productService: ProductService
  ) {
  }

  ngOnInit() {
    this.fridgeId = Number.parseInt(sessionStorage.getItem('selectedFridgeId') ?? '');
    this.loadShelves();
  }

  loadShelves() {
    if (!this.fridgeId) return;
    this.isLoading = true; // Set loading to true
    this.shelfService.getShelvesByFridgeId(this.fridgeId).subscribe({
      next: (shelves: Shelf[]) => {
        this.shelves = shelves;
        this.shelves.forEach(shelf => {
          this.loadProductsForShelf(shelf);
        });
        this.isLoading = false; // Set loading to false after loading shelves
      },
      error: (error) => {
        console.error('Failed to load shelves:', error);
        void this.commonService.presentToast(error.error.message, 'danger');
        this.isLoading = false; // Set loading to false in case of error
      }
    });
  }

  loadProductsForShelf(shelf: Shelf) {
    this.productService.getProductsByShelfId(shelf.shelfId!).subscribe({
      next: (products: Product[]) => {
        shelf.products = products;
      },
      error: (error) => {
        console.error(`Failed to load products for shelf ${shelf.shelfId}:`, error);
        void this.commonService.presentToast(error.error.message, 'danger');
      }
    });
  }

  searchProducts(event: any) {
    const query = event.target.value.toLowerCase();
    this.expandedShelfId = null;
    this.highlightedProducts = {};

    this.shelves.forEach(shelf => {
      let shelfExpanded = false;
      shelf.products?.forEach(product => {
        if (product.productName.toLowerCase().includes(query)) {
          shelfExpanded = true;
          this.highlightedProducts[product.productId!] = true;
        }
      });
      if (shelfExpanded) {
        this.expandedShelfId = shelf.shelfId!;
      }
    });
  }

  isProductHighlighted(productId: number): boolean {
    return this.highlightedProducts[productId] || false;
  }

  async startScan(isNewProduct: boolean) {
    await BarcodeScanner.checkPermission({force: true});
    await BarcodeScanner.hideBackground(); // Make background transparent
    const result = await BarcodeScanner.startScan(); // Start scanning

    if (result.hasContent) {
      const productDetails = JSON.parse(result.content);
      if (isNewProduct) {
        this.newProduct.productName = productDetails.productName;
        this.newProduct.quantity = productDetails.quantity;
        this.newProduct.unit = productDetails.unit;
        this.newProduct.expirationDate = productDetails.expirationDate;
        this.newProduct.opened_date = productDetails.opened_date;
      } else {
        this.selectedProduct.productName = productDetails.productName;
        this.selectedProduct.quantity = productDetails.quantity;
        this.selectedProduct.unit = productDetails.unit;
        this.selectedProduct.expirationDate = productDetails.expirationDate;
        this.selectedProduct.opened_date = productDetails.opened_date;
      }
    }
  }

  stopScan() {
    void BarcodeScanner.stopScan();
  }

  openAddShelfModal() {
    this.isAddModalOpen = true;
  }

  openUpdateProductModal(product: Product) {
    this.selectedProduct = {...product};
    this.isUpdateProductModalOpen = true;
    this.selectedShelf = this.shelves.find(shelf => shelf.shelfId === product.shelfId) ?? null;
  }

  deleteProduct(id: number) {
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.loadShelves();
        void this.commonService.presentToast('Product deleted successfully!', 'success');
      },
      error: (error) => {
        console.error('Failed to delete product:', error);
        void this.commonService.presentToast(error.error.message, 'danger');
      }
    });
  }

  closeAddShelfModal() {
    this.isAddModalOpen = false;
    this.newShelfName = '';
  }

  addShelf() {
    if (!this.newShelfName || !this.fridgeId) return;

    const newShelf: Shelf = {
      shelfName: this.newShelfName,
      fridgeId: this.fridgeId
    };

    this.shelfService.addShelf(newShelf).subscribe({
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

  openUpdateShelfModal(shelf: Shelf) {
    this.selectedShelf = shelf;
    this.selectedShelfName = shelf.shelfName;
    this.isUpdateModalOpen = true;
  }

  closeUpdateShelfModal() {
    this.isUpdateModalOpen = false;
    this.selectedShelf = null;
    this.selectedShelfName = '';
  }

  updateShelf() {
    if (!this.selectedShelf || !this.selectedShelfName) return;

    const updatedShelf: Shelf = {...this.selectedShelf, shelfName: this.selectedShelfName};

    this.shelfService.updateShelfName(this.selectedShelf.shelfId!, updatedShelf).subscribe({
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

  deleteShelf(id: number | undefined) {
    if (!id) return;

    this.shelfService.deleteShelf(id).subscribe({
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
    this.commonService.setShelfName(this.shelves.find(shelf => shelf.shelfId === shelfId)?.shelfName ?? '');
    this.commonService.navigateToPage(RoutePaths.ShelfProduct, this.route);
  }

  openAddProductModal(shelf: Shelf) {
    this.selectedShelf = shelf;
    this.isAddProductModalOpen = true;
  }

  closeAddProductModal() {
    this.isAddProductModalOpen = false;
    this.newProduct = {
      productName: '',
      quantity: 0,
      unit: Product.UnitEnum.G,
      opened_date: '',
      expirationDate: '',
      shelfId: 0
    };
  }

  addProduct() {
    if (!this.selectedShelf || !this.newProduct?.productName || !this.newProduct.quantity || !this.newProduct.unit || !this.newProduct.expirationDate) return;

    //check unit in Product.UnitEnum enum and set it to newProduct.unit
    if (!Object.values(Product.UnitEnum).includes(this.newProduct.unit)) {
      void this.commonService.presentToast('Invalid unit!', 'danger');
      return;
    }
    this.newProduct.unit = this.newProduct.unit as Product.UnitEnum;
    this.newProduct.expirationDate = this.formatDate(this.newProduct.expirationDate);
    if (this.newProduct.opened_date){
      this.newProduct.opened_date = this.formatDate(this.newProduct.opened_date);
    }
    const newProduct: Product = {
      ...this.newProduct,
      shelfId: this.selectedShelf.shelfId
    };

    this.productService.addProduct(newProduct).subscribe({
      next: () => {
        this.loadProductsForShelf(this.selectedShelf!);
        this.closeAddProductModal();
        void this.commonService.presentToast('Product added successfully!', 'success');
      },
      error: (error) => {
        console.error('Failed to add product:', error);
        void this.commonService.presentToast(error.error.message, 'danger');
      }
    });
  }

  closeUpdateProductModal() {
    this.isUpdateProductModalOpen = false;
    this.selectedProduct = {
      productName: '',
      quantity: 0,
      unit: Product.UnitEnum.G,
      opened_date: '',
      expirationDate: '',
      shelfId: 0
    };
  }

  updateProduct() {
    if (!this.selectedProduct) return;
    this.selectedProduct.expirationDate = this.formatDate(this.selectedProduct.expirationDate);
    if (this.selectedProduct.opened_date) {
      this.selectedProduct.opened_date = this.formatDate(this.selectedProduct.opened_date);
    }

    this.productService.updateProduct(this.selectedProduct.productId!, this.selectedProduct).subscribe({
      next: () => {
        this.loadProductsForShelf(this.selectedShelf!);
        this.closeUpdateProductModal();
        void this.commonService.presentToast('Product updated successfully!', 'success');
      },
      error: (error) => {
        console.error('Failed to update product:', error);
        void this.commonService.presentToast(error.error.message, 'danger');
      }
    });
  }

  // Function to format the date
  formatDate(date: string | Date): string {
    return new Date(date).toISOString().split('T')[0];
  }
}
