import {Component, OnInit} from '@angular/core';
import {CommonService} from '../../services/common.service';
import {RoutePaths} from '../../enums/route-paths';
import {ActivatedRoute, Router} from '@angular/router';
import {Product, Shelf} from 'src/app/openapi/generated-src';
import {AbstractPage} from '../abstract-page';
import {AuthService} from '../../services/auth.service';
import { CacheService } from 'src/app/services/cache.service';
import {CapacitorBarcodeScanner} from '@capacitor/barcode-scanner';
import { ModalController } from '@ionic/angular';
import {BehaviorSubject, filter, map, Observable, switchMap, tap} from 'rxjs';

@Component({
  selector: 'app-shelf',
  templateUrl: './shelf.component.html',
  styleUrls: ['./shelf.component.scss'],
})
export class ShelfComponent extends AbstractPage implements OnInit {
  newShelfName: string = '';
  selectedShelfName: string = '';
  selectedShelf: Shelf | null = null;
  isAddModalOpen: boolean = false;
  isUpdateModalOpen: boolean = false;
  isAddProductModalOpen: boolean = false;
  isUpdateProductModalOpen: boolean = false;
  fridgeId: number | undefined;
  newProduct: Product = <Product>{
    quantity: 0,
    unit: Product.UnitEnum.G,
  };
  selectedProduct: Product | undefined;
  isLoading: boolean = false;
  sortDirections: {[shelfId: number]: 'asc' | 'desc'} = {};
  private fridgeIdSubject$ = new BehaviorSubject<number | undefined>(undefined);
  shelves$: Observable<Shelf[]> = this.getShelvesStream().pipe(
    tap(() => this.isLoading = false)
  );

  constructor(
    readonly router: Router,
    authService: AuthService,
    cacheService: CacheService,
    commonService: CommonService,
  ) {
    super(authService, cacheService, commonService);
  }

  override ngOnInit() {
    super.ngOnInit();
    this.fridgeId = Number.parseInt(sessionStorage.getItem('selectedFridgeId') ?? '');
    this.fridgeIdSubject$.next(this.fridgeId);
    this.rebuildShelvesStream();
  }


  toggleSortDirection(shelfId: number) {
    const current = this.sortDirections[shelfId] || 'asc';
    this.sortDirections[shelfId] = current === 'asc' ? 'desc' : 'asc';
    this.rebuildShelvesStream();
  }

  rebuildShelvesStream() {
    this.shelves$ = this.getShelvesStream();
  }

  private getShelvesStream(): Observable<Shelf[]> {
    return this.fridgeIdSubject$.pipe(
      filter((id): id is number => id !== undefined), // Ensure fridgeId is defined
      switchMap(fridgeId => this.cacheService.getShelvesFromCacheByFridgeId(fridgeId).pipe(
        map(shelves => shelves.map(shelf => ({
          ...shelf,
          products: [...(shelf.products || [])].sort((a, b) => {
            const direction = this.sortDirections[shelf.shelfId!] || 'asc';
            const dateA = new Date(a.expirationDate).getTime();
            const dateB = new Date(b.expirationDate).getTime();
            return direction === 'asc' ? dateA - dateB : dateB - dateA;
          })
        })))
      ))
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

  // loadShelves() {
  //   if (!this.fridgeId) return;
  //   this.isLoading = true;
  //
  //   this.cacheService.getShelvesFromCacheByFridgeId(this.fridgeId).subscribe({
  //     next: () => {
  //       this.isLoading = false;
  //     },
  //     error: (error) => {
  //       console.error('Failed to load shelves from cache:', error);
  //       void this.commonService.presentToast(error.error.message, 'danger');
  //       this.isLoading = false;
  //     },
  //   });
  // }

   async startScan(isNewProduct: boolean) {
       try {
         const result = await CapacitorBarcodeScanner.scanBarcode({
           hint: 17,
           cameraDirection: 1
         });
         const barcode = result.ScanResult; // pl. "5991234567890"

         if (!barcode) return;

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
             this.selectedProduct!.productName = name;
             this.selectedProduct!.quantity = quantity;
             this.selectedProduct!.unit = unit as Product.UnitEnum;
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

  openAddShelfModal() {
    this.isAddModalOpen = true;
  }

  openUpdateProductModal(product: Product) {
    this.selectedProduct = {...product};
    this.isUpdateProductModalOpen = true;
    //this.selectedShelf = this.shelves.find(shelf => shelf.shelfId === product.shelfId) ?? null;
  }

  deleteProduct(productId: number) {
    this.cacheService.deleteProduct(productId).subscribe({
      next: () => {
        this.closeUpdateProductModal();
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
        this.rebuildShelvesStream();
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

  updateShelf() {
    if (!this.selectedShelf || !this.selectedShelfName) return;

    const updatedShelf: Shelf = { ...this.selectedShelf, shelfName: this.selectedShelfName };

    this.cacheService.updateShelfName(this.selectedShelf.shelfId!, updatedShelf).subscribe({
      next: () => {
        this.rebuildShelvesStream();
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
        this.rebuildShelvesStream();
        void this.commonService.presentToast('Shelf deleted successfully!', 'success');
      },
      error: (error) => {
        console.error('Failed to delete shelf:', error);
        void this.commonService.presentToast('Failed to delete shelf!', 'danger');
      }
    });
  }

  openAddProductModal(shelf: Shelf) {
    this.selectedShelf = shelf;
    this.isAddProductModalOpen = true;
  }

  closeAddProductModal() {
    this.isAddProductModalOpen = false;
    this.newProduct = <Product>{
      quantity: 0,
      unit: Product.UnitEnum.G,
    };
  }

  addProduct() {
    if (!this.selectedShelf || !this.newProduct?.productName || !this.newProduct.quantity || !this.newProduct.unit || !this.newProduct.expirationDate) return;

    if (!Object.values(Product.UnitEnum).includes(this.newProduct.unit)) {
      void this.commonService.presentToast('Invalid unit!', 'danger');
      return;
    }

    this.newProduct.unit = this.newProduct.unit as Product.UnitEnum;
    this.newProduct.expirationDate = this.formatDate(this.newProduct.expirationDate);
    if (this.newProduct.openedDate) {
      this.newProduct.openedDate = this.formatDate(this.newProduct.openedDate);
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
    this.selectedProduct = undefined;
  }

  updateProduct() {
    if (!this.selectedProduct) return;

    this.selectedProduct.expirationDate = this.formatDate(this.selectedProduct.expirationDate);
    if (this.selectedProduct.openedDate) {
      this.selectedProduct.openedDate = this.formatDate(this.selectedProduct.openedDate);
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

  formatDate(date: string | Date): string {
    return new Date(date).toISOString().split('T')[0];
  }
}
