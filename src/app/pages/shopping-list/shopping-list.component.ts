import { Component, OnInit } from '@angular/core';

interface Product {
  id: number;
  name: string;
  quantity: number;
  unit: string;
}

interface ShoppingList {
  id: number;
  name: string;
  isExpanded: boolean;
  products: Product[];
}

@Component({
  selector: 'app-shopping-list',
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.scss'],
})
export class ShoppingListComponent implements OnInit {
  shoppingLists: ShoppingList[] = [];
  newShoppingListName: string = '';
  newProductName: string = '';
  newProductQuantity: number | null = null;
  newProductUnit: string = '';
  editShoppingListName: string = '';
  editProductName: string = '';
  editProductQuantity: number | null = null;
  editProductUnit: string = '';
  isAddShoppingListModalOpen: boolean = false;
  isAddProductModalOpen: boolean = false;
  isEditShoppingListModalOpen: boolean = false;
  isEditProductModalOpen: boolean = false;
  currentEditingShoppingListId: number | null = null;
  currentEditingProduct: { productId: number; shoppingListId: number } | null = null;

  ngOnInit() {
    // Initialize with mock data
    this.shoppingLists = [
      {
        id: 1,
        name: 'Weekly Groceries',
        isExpanded: false,
        products: [
          { id: 1, name: 'Milk', quantity: 2, unit: 'l' },
          { id: 2, name: 'Bread', quantity: 1, unit: 'pcs' },
        ],
      },
      {
        id: 2,
        name: 'Party Supplies',
        isExpanded: false,
        products: [
          { id: 3, name: 'Chips', quantity: 3, unit: 'pcs' },
          { id: 4, name: 'Soda', quantity: 5, unit: 'l' },
        ],
      },
    ];
  }

  // Toggle list expansion
  toggleListExpansion(shoppingListId: number) {
    const shoppingList = this.shoppingLists.find(list => list.id === shoppingListId);
    if (shoppingList) {
      shoppingList.isExpanded = !shoppingList.isExpanded;
    }
  }

  // Open add shopping list modal
  openAddShoppingListModal() {
    this.isAddShoppingListModalOpen = true;
  }

  // Close add shopping list modal
  closeAddShoppingListModal() {
    this.isAddShoppingListModalOpen = false;
    this.newShoppingListName = '';
  }

  // Add a new shopping list
  addShoppingList() {
    if (this.newShoppingListName.trim()) {
      const newList: ShoppingList = {
        id: this.shoppingLists.length + 1,
        name: this.newShoppingListName,
        isExpanded: false,
        products: [],
      };
      this.shoppingLists.push(newList);
      this.closeAddShoppingListModal();
    }
  }

  // Open add product modal
  openAddProductModal(shoppingListId: number) {
    this.currentEditingShoppingListId = shoppingListId;
    this.isAddProductModalOpen = true;
  }

  // Close add product modal
  closeAddProductModal() {
    this.isAddProductModalOpen = false;
    this.newProductName = '';
    this.newProductQuantity = null;
    this.newProductUnit = '';
  }

  // Add a product to shopping list
  addProductToShoppingList() {
    if (this.currentEditingShoppingListId && this.newProductName.trim() && this.newProductQuantity && this.newProductUnit) {
      const shoppingList = this.shoppingLists.find(list => list.id === this.currentEditingShoppingListId);
      if (shoppingList) {
        const newProduct: Product = {
          id: shoppingList.products.length + 1,
          name: this.newProductName,
          quantity: this.newProductQuantity,
          unit: this.newProductUnit,
        };
        shoppingList.products.push(newProduct);
      }
      this.closeAddProductModal();
    }
  }

  // Open edit shopping list modal
  openEditShoppingListModal(shoppingList: ShoppingList) {
    this.currentEditingShoppingListId = shoppingList.id;
    this.editShoppingListName = shoppingList.name;
    this.isEditShoppingListModalOpen = true;
  }

  // Close edit shopping list modal
  closeEditShoppingListModal() {
    this.isEditShoppingListModalOpen = false;
    this.editShoppingListName = '';
    this.currentEditingShoppingListId = null;
  }

  // Update shopping list name
  updateShoppingList() {
    if (this.currentEditingShoppingListId && this.editShoppingListName.trim()) {
      const shoppingList = this.shoppingLists.find(list => list.id === this.currentEditingShoppingListId);
      if (shoppingList) {
        shoppingList.name = this.editShoppingListName;
      }
      this.closeEditShoppingListModal();
    }
  }

  // Toggle edit product modal
  toggleEditProduct(product: Product, shoppingListId: number) {
    this.currentEditingProduct = { productId: product.id, shoppingListId };
    this.editProductName = product.name;
    this.editProductQuantity = product.quantity;
    this.editProductUnit = product.unit;
    this.isEditProductModalOpen = true;
  }

  // Close edit product modal
  closeEditProductModal() {
    this.isEditProductModalOpen = false;
    this.editProductName = '';
    this.editProductQuantity = null;
    this.editProductUnit = '';
    this.currentEditingProduct = null;
  }

  // Update product in shopping list
  updateProduct() {
    if (this.currentEditingProduct && this.editProductName.trim() && this.editProductQuantity && this.editProductUnit) {
      const shoppingList = this.shoppingLists.find(list => list.id === this.currentEditingProduct?.shoppingListId);
      if (shoppingList) {
        const product = shoppingList.products.find(prod => prod.id === this.currentEditingProduct?.productId);
        if (product) {
          product.name = this.editProductName;
          product.quantity = this.editProductQuantity;
          product.unit = this.editProductUnit;
        }
      }
      this.closeEditProductModal();
    }
  }

  // Delete shopping list
  deleteShoppingList(shoppingListId: number) {
    this.shoppingLists = this.shoppingLists.filter(list => list.id !== shoppingListId);
  }

  // Delete product from shopping list
  deleteProduct(productId: number, shoppingListId: number) {
    const shoppingList = this.shoppingLists.find(list => list.id === shoppingListId);
    if (shoppingList) {
      shoppingList.products = shoppingList.products.filter(product => product.id !== productId);
    }
  }
}
