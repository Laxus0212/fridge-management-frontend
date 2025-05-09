import {Component, OnInit} from '@angular/core';
import {CommonService} from '../../services/common.service';
import {RoutePaths} from '../../enums/route-paths';
import {ActivatedRoute, Router} from '@angular/router';
import {Product, ProductService, Shelf, ShelfService} from 'src/app/openapi/generated-src';
import {AbstractPage} from '../abstract-page';
import {AuthService} from '../../services/auth.service';
import { CacheService } from 'src/app/services/cache.service';
import {CapacitorBarcodeScanner} from '@capacitor/barcode-scanner';
import { ModalController } from '@ionic/angular';
import {LogPopupComponent} from '../../components/log-popup/log-popup.component';
import {map, Observable, tap} from 'rxjs';
import {ShelfViewModel} from './shelf-view-model';

@Component({
  selector: 'app-shelf',
  templateUrl: './shelf.component.html',
  styleUrls: ['./shelf.component.scss'],
})
export class ShelfComponent extends AbstractPage implements OnInit {
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
  isLoading: boolean = false;
  searchQuery: string = '';
  highlightedProducts: { [key: number]: boolean } = {};
  expandedShelfId: number | null = null;
  sortDirections: {[shelfId: number]: 'asc' | 'desc'} = {};


  constructor(
    private shelfService: ShelfService,
    readonly activatedRoute: ActivatedRoute,
    readonly router: Router,
    authService: AuthService,
    cacheService: CacheService,
    commonService: CommonService,
    private route: ActivatedRoute,
    private productService: ProductService,
    private readonly modalController: ModalController,
    //private barcodeScanner: BarcodeScanner
  ) {
    super(authService, cacheService, commonService);
  }

  override ngOnInit() {
    super.ngOnInit();
    this.fridgeId = Number.parseInt(sessionStorage.getItem('selectedFridgeId') ?? '');
    this.loadShelves();
    this.route.queryParams.subscribe(params => {
      const scannedBarcode = params['barcode'];
      if (scannedBarcode) {
        // használd itt a kódot
        console.log('Beolvasott vonalkód:', scannedBarcode);
      }
    });

    this.cacheService.getProducts().subscribe((products) => {
      this.shelves.forEach((shelf) => {
        shelf.products = products.filter((product) => product.shelfId === shelf.shelfId);
      });
    });
    this.rebuildShelvesStream();
  }

  shelves$: Observable<ShelfViewModel[]> = this.cacheService.getShelves().pipe(
    map(shelves => shelves.map(shelf => ({
      ...shelf,
      products$: this.cacheService.getProducts().pipe(
        map(products => {
          const shelfProducts = products.filter(p => p.shelfId === shelf.shelfId);
          const direction = this.sortDirections[shelf.shelfId!] || 'asc';
          return [...shelfProducts].sort((a, b) => {
            const dateA = new Date(a.expirationDate).getTime();
            const dateB = new Date(b.expirationDate).getTime();
            return direction === 'asc' ? dateA - dateB : dateB - dateA;
          });
        })
      )
    })))
  );

  toggleSortDirection(shelfId: number) {
    const current = this.sortDirections[shelfId] || 'asc';
    this.sortDirections[shelfId] = current === 'asc' ? 'desc' : 'asc';
    this.rebuildShelvesStream();
  }

  rebuildShelvesStream() {
    this.shelves$ = this.cacheService.getShelves().pipe(
      map(shelves => shelves.map(shelf => ({
        ...shelf,
        products$: this.cacheService.getProducts().pipe(
          map(products => {
            const shelfProducts = products.filter(p => p.shelfId === shelf.shelfId);
            const direction = this.sortDirections[shelf.shelfId!] || 'asc';
            return [...shelfProducts].sort((a, b) => {
              const dateA = new Date(a.expirationDate).getTime();
              const dateB = new Date(b.expirationDate).getTime();
              return direction === 'asc' ? dateA - dateB : dateB - dateA;
            });
          })
        )
      })))
    );
  }

  getExpirationStatus(expirationDate: string): 'good' | 'warning' | 'expired' {
    const today = new Date();
    const expiry = new Date(expirationDate);

    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 5) {
      return 'good';
    } else if (diffDays >= 0) {
      return 'warning';
    } else {
      return 'expired';
    }
  }

  loadShelves() {
    if (!this.fridgeId) return;
    this.isLoading = true;
    this.cacheService.loadShelves(this.fridgeId).subscribe({
      next: (shelves) => {
        this.shelves = shelves;
        this.shelves.forEach((shelf) => this.loadProductsForShelf(shelf));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load shelves:', error);
        void this.commonService.presentToast(error.error.message, 'danger');
        this.isLoading = false;
      },
    });
  }

  loadProductsForShelf(shelf: Shelf) {
    this.cacheService.loadShelfProductsIntoCache(shelf.shelfId!).subscribe({
      next: products => {
        shelf.products = products;
      },
      error: error => {
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

  // scanBarcode() {
  //   this.barcodeScanner.scan().then(barcodeData => {
  //     console.log('Barcode data:', barcodeData);
  //
  //     // példa: vonalkódból termék hozzáadása
  //     const scannedText = barcodeData.text;
  //     if (scannedText) {
  //       this.handleScannedBarcode(scannedText);
  //     }
  //   }).catch(err => {
  //     console.error('Error', err);
  //   });
  // }

  async openLogPopup() {
    const modal = await this.modalController.create({
      component: LogPopupComponent,
    });
    return await modal.present();
  }

   async startScan(isNewProduct: boolean) {

       try {
         const result = await CapacitorBarcodeScanner.scanBarcode({
           hint: 17,
           cameraDirection: 1
         });
         const barcode = result.ScanResult; // pl. "5991234567890"

         if (!barcode) return;

         console.log('Scanned barcode:', barcode);

         const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
         const data = await response.json();

         if (data.status === 1) {
           const product = data.product;
           const name = product.product_name || '';
           const quantity = parseFloat(product.quantity?.replace(/[^0-9.]/g, '')) || 1;
           const unit = product.quantity?.includes('ml') || product.quantity?.includes('l') ? 'ml' : 'pcs';

           if (isNewProduct) {
             this.newProduct.productName = name;
             this.newProduct.quantity = quantity;
             this.newProduct.unit = unit as Product.UnitEnum;
           } else {
             this.selectedProduct.productName = name;
             this.selectedProduct.quantity = quantity;
             this.selectedProduct.unit = unit as Product.UnitEnum;
           }

           void this.commonService.presentToast(`Product found: ${name}`, 'success');
         } else {
           void this.commonService.presentToast('Product not found in database', 'warning');
         }
       } catch (error) {
         console.error('Scan failed', error);
         void this.commonService.presentToast('Scan failed!', 'danger');
       }

  }

  async stopScan() {
    document.body.classList.remove('scanner-active');
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
    this.cacheService.deleteProduct(id).subscribe({
      next: () => {
        //this.loadShelves();
        void this.commonService.presentToast('Product deleted successfully!', 'success');
      },
      error: (error) => {
        console.error('Failed to delete product:', error);
        void this.commonService.presentToast('Failed to delete product!', 'danger');
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

    this.cacheService.addShelf(newShelf).subscribe({
      next: () => {
        this.closeAddShelfModal();
        void this.commonService.presentToast('Shelf added successfully!', 'success');
      },
      error: (error) => {
        console.error('Failed to add shelf:', error);
        void this.commonService.presentToast('Failed to add shelf!', 'danger');
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

  // updateShelf() {
  //   if (!this.selectedShelf || !this.selectedShelfName) return;
  //
  //   const updatedShelf: Shelf = {...this.selectedShelf, shelfName: this.selectedShelfName};
  //
  //   this.shelfService.updateShelfName(this.selectedShelf.shelfId!, updatedShelf).subscribe({
  //     next: () => {
  //       this.loadShelves();
  //       this.closeUpdateShelfModal();
  //       void this.commonService.presentToast('Shelf updated successfully!', 'success');
  //     },
  //     error: (error) => {
  //       console.error('Failed to update shelf:', error);
  //       void this.commonService.presentToast(error.error.message, 'danger');
  //     }
  //   });
  // }

  updateShelf() {
    if (!this.selectedShelf || !this.selectedShelfName) return;

    const updatedShelf: Shelf = { ...this.selectedShelf, shelfName: this.selectedShelfName };

    this.cacheService.updateShelfName(this.selectedShelf.shelfId!, updatedShelf).subscribe({
      next: () => {
        this.closeUpdateShelfModal();
        void this.commonService.presentToast('Shelf updated successfully!', 'success');
      },
      error: (error) => {
        console.error('Failed to update shelf:', error);
        void this.commonService.presentToast('Failed to update shelf!', 'danger');
      }
    });
  }

  deleteShelf(id: number | undefined) {
    if (!id) return;

    this.cacheService.deleteShelf(id).subscribe({
      next: () => {
        void this.commonService.presentToast('Shelf deleted successfully!', 'success');
      },
      error: (error) => {
        console.error('Failed to delete shelf:', error);
        void this.commonService.presentToast('Failed to delete shelf!', 'danger');
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

    this.cacheService.addProduct(newProduct).subscribe({
      next: () => {
        this.closeAddProductModal();
        void this.commonService.presentToast('Product added successfully!', 'success');
      },
      error: (error) => {
        console.error('Failed to add product:', error);
        void this.commonService.presentToast('Failed to add product!', 'danger');
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

    this.cacheService.updateProduct(this.selectedProduct.productId!, this.selectedProduct).subscribe({
      next: () => {
        this.closeUpdateProductModal();
        void this.commonService.presentToast('Product updated successfully!', 'success');
      },
      error: (error) => {
        console.error('Failed to update product:', error);
        void this.commonService.presentToast('Failed to update product!', 'danger');
      }
    });
  }

  // Function to format the date
  formatDate(date: string | Date): string {
    return new Date(date).toISOString().split('T')[0];
  }
}
