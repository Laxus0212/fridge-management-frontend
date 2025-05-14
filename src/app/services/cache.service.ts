import {Injectable} from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  distinctUntilChanged,
  filter,
  forkJoin,
  map,
  Observable,
  switchMap,
  take,
  tap,
  throwError
} from 'rxjs';
import {
  CreateRecipe,
  Family,
  FamilyMember,
  FamilyService,
  Fridge,
  FridgeService,
  Invitation,
  Product,
  ProductService, Recipe, RecipeService,
  RegisterUser201Response,
  Shelf,
  ShelfService,
  ShoppingList, ShoppingListItem,
  ShoppingListService,
  UpdateFridgeReq, UpdateRecipe,
  UpdateUserReq,
  User,
  UserService,
} from '../openapi/generated-src';
import {Chat} from '../openapi/generated-src/model/chat';

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private fridgeCache$ = new BehaviorSubject<Fridge[]>([]);
  private shoppingListCache$ = new BehaviorSubject<ShoppingList[]>([]);
  private shelfCache$ = new BehaviorSubject<Shelf[]>([]);
  private allShelvesWithProducts$ = new BehaviorSubject<Shelf[]>([]);
  private productCache$ = new BehaviorSubject<Product[]>([]);
  private accountCache$ = new BehaviorSubject<User | null>(null);
  private familyCache$ = new BehaviorSubject<Family | null>(null);
  private chatCache$ = new BehaviorSubject<Chat | null>(null);
  private familyMembersCache$ = new BehaviorSubject<FamilyMember[]>([]);
  private isLoadingSubject$ = new BehaviorSubject<boolean>(false);
  private favoriteRecipesSubject$ = new BehaviorSubject<Recipe[]>([]);
  private familyRecipesSubject$ = new BehaviorSubject<Recipe[]>([]);
  private allFridgeProductsCache$ = new BehaviorSubject<Product[]>([]);
  isLoading$ = this.isLoadingSubject$.asObservable();
  private cacheLoaded = false;

  constructor(
    public fridgeService: FridgeService,
    private shoppingListService: ShoppingListService,
    private shelfService: ShelfService,
    private productService: ProductService,
    private userService: UserService,
    private familyService: FamilyService,
    private recipeService: RecipeService,
  ) {
    // this.productCache$.subscribe(products => {
    //   this.allFridgeProductsCache$.next(products);
    // });
  }

  /** Load all fridges for the user and store them in cache */
  loadFridges(userId: number | null, familyId: number | null): void {
    this.isLoadingSubject$.next(true); // Start loading
    this.syncFridges(userId, familyId);

    this.getFridges().pipe(
      filter(fridges => fridges.length > 0),
      take(1)
    ).subscribe(() => {
      this.loadAllFridgeProducts();
    });
  }

  //clearCache
  clearCache(): void {
    this.fridgeCache$.next([]);
    this.shoppingListCache$.next([]);
    this.shelfCache$.next([]);
    this.productCache$.next([]);
    //this.accountCache$.next(null);
    this.familyCache$.next(null);
    this.chatCache$.next(null);
    this.familyMembersCache$.next([]);
    this.favoriteRecipesSubject$.next([]);
    this.familyRecipesSubject$.next([]);
    this.allFridgeProductsCache$.next([]);

  }

  //syncronize cache with the server data
  syncFridges(userId: number | null, familyId: number | null): void {
    if (userId) {
      this.fridgeService.getUserFridges(userId).subscribe({
        next: (fridges) => {
          if (familyId) {
            this.makeMergedFridgesFromOwnedAndFamilys(familyId, fridges);
          } else {
            this.fridgeCache$.next([...fridges]);
            //this.loadAllFridgeProducts();
            this.isLoadingSubject$.next(false); // Stop loading
          }
        },
        error: () => this.isLoadingSubject$.next(false)
      });
    } else {
      this.isLoadingSubject$.next(false);
    }
  }

  getAllFridgeProducts(): Observable<Product[]> {
    return this.allFridgeProductsCache$.asObservable();
  }

  // loadAllFridgeProducts(): void {
  //   this.getFridges().pipe(
  //     filter(fridges => fridges.length > 0),
  //     switchMap(fridges => {
  //       const shelvesRequests = fridges.map(fridge => this.loadShelves(fridge.fridgeId!));
  //       return forkJoin(shelvesRequests);
  //     }),
  //     switchMap(() => this.getShelves()),
  //     switchMap(shelves => {
  //       const productsRequests = shelves.map(shelf => this.loadShelfProducts(shelf.shelfId!));
  //       return forkJoin(productsRequests);
  //     }),
  //     map(productsArrays => productsArrays.flat())
  //   ).subscribe({
  //     next: (allProducts) => this.allFridgeProductsCache$.next(allProducts),
  //     error: (error) => console.error('Failed to load all fridge products:', error),
  //   });
  // }

  loadAllFridgeProducts(): void {
    this.getFridges().pipe(
      filter(fridges => fridges.length > 0),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      switchMap(fridges => {
        const allShelvesRequests = fridges.map(fridge =>
          this.shelfService.getShelvesByFridgeId(fridge.fridgeId!)
        );
        return forkJoin(allShelvesRequests).pipe(
          map(shelvesArrays => shelvesArrays.flat())
        );
      }),
      tap(allShelves => {
        this.shelfCache$.next(allShelves);
        this.allShelvesWithProducts$.next(allShelves);
      }),
      map(allShelves => {
        const allProducts = allShelves.flatMap(shelf => shelf.products || []);

        const uniqueMap = new Map<number, Product>();
        allProducts.forEach(p => {
          if (!uniqueMap.has(p.productId!)) {
            uniqueMap.set(p.productId!, p);
          }
        });

        return Array.from(uniqueMap.values());
      })
    ).subscribe({
      next: (uniqueProducts) => {
        this.allFridgeProductsCache$.next(uniqueProducts);
      },
      error: (error) => console.error('Failed to load all fridge products:', error),
    });
  }

  getAllShelvesWithProducts(): Observable<Shelf[]> {
    return this.allShelvesWithProducts$.asObservable();
  }

  getShelvesFromCacheByFridgeId(fridgeId: number): Observable<Shelf[]> {
    return this.allShelvesWithProducts$.pipe(
      map(shelves => shelves.filter(shelf => shelf.fridgeId === fridgeId)),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    )
  }

  //full load
  fullLoad(userId: number | null, familyId: number | null): void {
    this.loadFridges(userId, familyId);
    this.loadFamilyData(familyId);
    this.loadShoppingLists(userId);
    this.loadFavoriteRecipes(userId!);
    this.loadFamilyRecipes(userId!, familyId!);
    this.getPendingInvites(userId!);
  }

  /** Add a new fridge and synchronize the cache */
  addFridge(newFridge: Fridge, userId: number | null, familyId: number | null): void {
    this.fridgeService.addFridge(newFridge).subscribe({
      next: () => this.syncFridges(userId, familyId),
      error: (error) => console.error('Failed to add fridge:', error)
    });
  }

  /** Update an existing fridge and synchronize the cache */
  updateFridge(fridgeId: number, updatedFridge: UpdateFridgeReq, userId: number | null, familyId: number | null): void {
    this.fridgeService.updateFridge(fridgeId, updatedFridge).subscribe({
      next: () => this.syncFridges(userId, familyId),
      error: (error) => console.error('Failed to update fridge:', error)
    });
  }

  /** Delete a fridge and synchronize the cache */
  deleteFridge(fridgeId: number, userId: number | null, familyId: number | null): void {
    this.fridgeService.deleteFridge(fridgeId).subscribe({
      next: () => this.syncFridges(userId, familyId),
      error: (error) => console.error('Failed to delete fridge:', error)
    });
  }

  private makeMergedFridgesFromOwnedAndFamilys(familyId: number, fridges: Fridge[]) {
    this.fridgeService.getFamilyFridges(familyId).subscribe({
      next: (familyFridges) => {
        const mergedFridges = [...fridges];
        familyFridges.forEach(familyFridge => {
          if (!mergedFridges.some(f => f.fridgeId === familyFridge.fridgeId)) {
            mergedFridges.push(familyFridge);
          }
        });
        this.fridgeCache$.next(mergedFridges);
        //this.loadAllFridgeProducts();
        this.isLoadingSubject$.next(false); // Stop loading
      },
      error: () => this.isLoadingSubject$.next(false)
    });
  }

  /** Load shelves for a specific fridge */
  loadShelves(fridgeId: number): Observable<Shelf[]> {
    return this.shelfService.getShelvesByFridgeId(fridgeId).pipe(
      tap(shelves => this.shelfCache$.next(shelves))
    );
  }

  loadShelfProductsIntoCache(shelfId: number): Observable<Product[]> {
    return this.loadShelfProducts(shelfId).pipe(
      tap((products) => {
        const currentProducts = this.productCache$.getValue();
        const updatedProducts = [
          ...currentProducts.filter((p) => p.shelfId !== shelfId),
          ...products,
        ];
        this.productCache$.next(updatedProducts);
      })
    );
  }

  /** Get products for a specific shelf */
  loadShelfProducts(shelfId: number): Observable<Product[]> {
    return this.productService.getProductsByShelfId(shelfId);
  }

  /** Add a new product */
  addProduct(newProduct: Product): Observable<Product> {
    return this.productService.addProduct(newProduct).pipe(
      tap((product) => {
        this.allShelvesWithProducts$.pipe(
          filter(shelves => shelves.length > 0),
          take(1)
        ).subscribe((shelves) => {
          const shelf = shelves.find(shelf => shelf.shelfId === product.shelfId);
          if (shelf) {
            shelf.products?.push(newProduct);
          }
        }
        )
        const currentProducts = this.productCache$.getValue();
        this.productCache$.next([...currentProducts, product]);
        const allProducts = this.allFridgeProductsCache$.getValue();
        this.allFridgeProductsCache$.next([...allProducts, product]);
      }),
      catchError((error) => {
        console.error('Failed to add product:', error);
        return throwError(() => error);
      })
    );
  }

  /** Update an existing product */
  updateProduct(productId: number, updatedProduct: Product): Observable<Product> {
    return this.productService.updateProduct(productId, updatedProduct).pipe(
      tap(() => {
        this.allShelvesWithProducts$.pipe(
          filter(shelves => shelves.length > 0),
          take(1)
        ).subscribe((shelves) => {
          const shelf = shelves.find(shelf => shelf.shelfId === updatedProduct.shelfId);
          if (shelf) {
            const productIndex = shelf.products?.findIndex(product => product.productId === productId);
            if (productIndex !== undefined && productIndex !== -1) {
              shelf.products![productIndex] = updatedProduct;
            }
          }
        }
        )
        const currentProducts = this.productCache$.getValue();
        const updatedProducts = currentProducts.map((product) =>
          product.productId === productId ? updatedProduct : product
        );
        this.productCache$.next(updatedProducts);
        const allProducts = this.allFridgeProductsCache$.getValue();
        const updatedAllProducts = allProducts.map((product) =>
          product.productId === productId ? updatedProduct : product
        );
        this.allFridgeProductsCache$.next(updatedAllProducts);
      }),
      catchError((error) => {
        console.error('Failed to update product:', error);
        return throwError(() => error);
      })
    );
  }

  /** Delete a product */
  deleteProduct(productId: number): Observable<void> {
    return this.productService.deleteProduct(productId).pipe(
      tap(() => {
        this.allShelvesWithProducts$.pipe(
          filter(shelves => shelves.length > 0),
          take(1)
        ).subscribe((shelves) => {
          shelves.forEach(shelf => {
            const productIndex = shelf.products?.findIndex(product => product.productId === productId);
            if (productIndex !== undefined && productIndex !== -1) {
              shelf.products!.splice(productIndex, 1);
            }
          });
        }
        )
        const currentProducts = this.productCache$.getValue();
        const updatedProducts = currentProducts.filter(
          (product) => product.productId !== productId
        );
        this.productCache$.next(updatedProducts);
        const allProducts = this.allFridgeProductsCache$.getValue();
        const updatedAllProducts = allProducts.filter(
          (product) => product.productId !== productId
        );
        this.allFridgeProductsCache$.next(updatedAllProducts);
      }),
      catchError((error) => {
        console.error('Failed to delete product:', error);
        return throwError(() => error);
      })
    );
  }

  /** Get cached products as an observable */
  getProducts(): Observable<Product[]> {
    return this.productCache$.asObservable();
  }

  /** Load family data and members */
  loadFamilyData(familyId: number | null): void {
    if (familyId) {
      this.familyService.getFamilyById(familyId).subscribe({
        next: (family) => this.familyCache$.next(family),
        error: () => {
        }
      });
      this.loadFamilyMembers(familyId);
    }
  }

  loadFamilyMembers(familyId: number | null) {
    if (familyId) {
      this.familyService.getFamilyMembers(familyId).subscribe({
        next: (members) => this.familyMembersCache$.next(members),
        error: () => {
        }
      });
    }
  }

  //get chat from family service and store it in cache
  async getChat(familyId: number): Promise<Chat | null> {
    const cachedChat = this.chatCache$.getValue();
    if (cachedChat) {
      return cachedChat;
    } else {
      return new Promise((resolve, reject) => {
        this.familyService.getChatByFamilyId(familyId).subscribe({
          next: (chat) => {
            const chatData = chat as unknown as Chat;
            this.chatCache$.next(chatData);
            resolve(chatData);
          },
          error: (error: any) => {
            console.error('Failed to load chat:', error);
            reject(null);
          }
        });
      });
    }
  }

  createFamily(familyName: string, userId: number | null): Observable<Family> {
    return this.familyService.createFamily({familyName});
  }

  inviteUserToFamily(familyId: number, email: string): Observable<Invitation> {
    return this.familyService.inviteUserToFamily(familyId, {email});
  }

  acceptInvite(invitationId: number): Observable<Invitation> {
    return this.familyService.acceptInvite(invitationId, {status: 'accepted'});
  }

  declineInvite(invitationId: number): Observable<Invitation> {
    return this.familyService.declineInvite(invitationId, {status: 'declined'});
  }

  leaveFamily(familyId: number, userId: number): Observable<RegisterUser201Response> {
    return this.familyService.leaveFamily(familyId, {userId});
  }

  getPendingInvites(userId: number): Observable<Invitation[]> {
    return this.familyService.getPendingInvites(userId);
  }

  /** Get cached data as observables */
  getFridges(): Observable<Fridge[]> {
    return this.fridgeCache$.asObservable();
  }

  loadShoppingLists(userId: number | null): void {
    if (userId) {
      this.shoppingListService.getShoppingListsByUserId(userId).subscribe({
        next: (lists) => this.shoppingListCache$.next([...lists]),
        error: (error) => console.error('Failed to load shopping lists:', error),
      });
    }
  }

  addShoppingList(newList: ShoppingList, userId: number | null): Observable<void> {
    return this.shoppingListService.createShoppingList(newList).pipe(
      tap(() => this.loadShoppingLists(userId)),
      map(() => void 0),
      catchError((error) => {
        console.error('Failed to add shopping list:', error);
        return throwError(() => error);
      })
    );
  }

  updateShoppingList(listId: number, updatedList: ShoppingList, userId: number | null): Observable<void> {
    return this.shoppingListService.updateShoppingList(listId, updatedList).pipe(
      tap(() => this.loadShoppingLists(userId)),
      map(() => void 0),
      catchError((error) => {
        console.error('Failed to update shopping list:', error);
        return throwError(() => error);
      })
    );
  }

  deleteShoppingList(listId: number, userId: number | null): Observable<void> {
    return this.shoppingListService.deleteShoppingList(listId).pipe(
      tap(() => this.loadShoppingLists(userId)),
      map(() => void 0),
      catchError((error) => {
        console.error('Failed to delete shopping list:', error);
        return throwError(() => error);
      })
    );
  }

  /** Add a product to a shopping list and refresh the list */
  addItemToShoppingList(listId: number, item: ShoppingListItem, userId: number | null): Observable<void> {
    return this.shoppingListService.addItemToShoppingList(listId, item).pipe(
      tap(() => this.loadShoppingLists(userId)),
      map(() => void 0),
      catchError((error) => {
        console.error('Failed to add item to shopping list:', error);
        return throwError(() => error);
      })
    );
  }

  /** Delete a product from a shopping list and refresh the list */
  deleteShoppingListItem(listId: number, itemId: number, userId: number | null): Observable<void> {
    return this.shoppingListService.deleteShoppingListItem(listId, itemId).pipe(
      tap(() => this.loadShoppingLists(userId)),
      map(() => void 0),
      catchError((error) => {
        console.error('Failed to delete item from shopping list:', error);
        return throwError(() => error);
      })
    );
  }

  /** Update a shopping list item and refresh the list */
  updateShoppingListItem(listId: number, itemId: number, updatedItem: ShoppingListItem, userId: number | null): Observable<void> {
    return this.shoppingListService.updateShoppingListItem(listId, itemId, updatedItem).pipe(
      tap(() => this.loadShoppingLists(userId)),
      map(() => void 0),
      catchError((error) => {
        console.error('Failed to update item in shopping list:', error);
        return throwError(() => error);
      })
    );
  }

  getShoppingLists(): Observable<ShoppingList[]> {
    return this.shoppingListCache$.asObservable();
  }

  getShelves(): Observable<Shelf[]> {
    return this.shelfCache$.asObservable();
  }

  /** Add a new shelf and update the cache */
  addShelf(newShelf: Shelf): Observable<Shelf> {
    return this.shelfService.addShelf(newShelf).pipe(
      tap((shelf) => {
        const currentShelves = this.shelfCache$.getValue();
        this.shelfCache$.next([...currentShelves, shelf]);
        const currentAllShelves = this.allShelvesWithProducts$.getValue();
        this.allShelvesWithProducts$.next([...currentAllShelves, shelf]);
      }),
      catchError((error) => {
        console.error('Failed to add shelf:', error);
        return throwError(() => error);
      })
    );
  }

  /** Update a shelf name and synchronize the cache */
  updateShelfName(shelfId: number, updatedShelf: Shelf): Observable<Shelf> {
    return this.shelfService.updateShelfName(shelfId, updatedShelf).pipe(
      tap(() => {
        const currentShelves = this.shelfCache$.getValue();
        const updatedShelves = currentShelves.map((shelf) =>
          shelf.shelfId === shelfId ? { ...shelf, shelfName: updatedShelf.shelfName } : shelf
        );
        this.shelfCache$.next(updatedShelves);
        const currentAllShelves = this.allShelvesWithProducts$.getValue();
        const updatedAllShelves = currentAllShelves.map((shelf) =>
          shelf.shelfId === shelfId ? { ...shelf, shelfName: updatedShelf.shelfName } : shelf
        );
        this.allShelvesWithProducts$.next(updatedAllShelves);
      }),
      catchError((error) => {
        console.error('Failed to update shelf:', error);
        return throwError(() => error);
      })
    );
  }

  /** Delete a shelf and update the cache */
  deleteShelf(shelfId: number): Observable<any> {
    return this.shelfService.deleteShelf(shelfId).pipe(
      tap(() => {
        const currentShelves = this.shelfCache$.getValue();
        const updatedShelves = currentShelves.filter((shelf) => shelf.shelfId !== shelfId);
        this.shelfCache$.next(updatedShelves);
        const currentAllShelves = this.allShelvesWithProducts$.getValue();
        const updatedAllShelves = currentAllShelves.filter((shelf) => shelf.shelfId !== shelfId);
        this.allShelvesWithProducts$.next(updatedAllShelves);
      }),
      catchError((error) => {
        console.error('Failed to delete shelf:', error);
        return throwError(() => error);
      })
    );
  }

  getShelfProducts(): Observable<Product[]> {
    return this.productCache$.asObservable();
  }

  getAccountData(): Observable<User | null> {
    return this.accountCache$.asObservable();
  }

  getFamilyData(): Observable<Family | null> {
    return this.familyCache$.asObservable();
  }

  getFamilyMembers(): Observable<FamilyMember[]> {
    return this.familyMembersCache$.asObservable();
  }


  updateUserFamily(userId: number, updatedUser: UpdateUserReq): Observable<User> {
    return this.userService.updateUserById(userId, updatedUser);
  }

  getFavoriteRecipes(userId: number): Observable<Recipe[]> {
    if (this.favoriteRecipesSubject$.getValue().length === 0) {
      this.loadFavoriteRecipes(userId);
    }
    return this.favoriteRecipesSubject$.asObservable();
  }

  getFamilyRecipes(userId: number, familyId: number): Observable<Recipe[]> {
    if (this.familyRecipesSubject$.getValue().length === 0) {
      this.loadFamilyRecipes(userId, familyId);
    }
    return this.familyRecipesSubject$.asObservable();
  }

  loadFavoriteRecipes(userId: number) {
    this.recipeService.getUsersFavoriteRecipes(userId).subscribe({
      next: (recipes) => this.favoriteRecipesSubject$.next(recipes),
      error: () => console.error('Failed to load user recipes'),
    });
  }

  loadFamilyRecipes(userId: number, familyId: number) {
    if (familyId){
      this.recipeService.getUsersFamilySharedRecipes(userId, familyId).subscribe({
        next: (recipes) => this.familyRecipesSubject$.next(recipes),
        error: () => console.error('Failed to load family shared recipes'),
      });
    }else {
      this.familyRecipesSubject$.next([]);
    }
  }

  saveRecipeToFavorites(createRecipeDto: CreateRecipe): Observable<Recipe> {
    return this.recipeService.createRecipe(createRecipeDto).pipe(
      tap(() => {
        if (createRecipeDto.savedBy) {
          this.loadFavoriteRecipes(createRecipeDto.savedBy);
        }
      })
    );
  }

  updateRecipe(recipeId: number, userId: number, update: UpdateRecipe): Observable<Recipe> {
    return this.recipeService.updateRecipe(recipeId, update).pipe(
      tap((updatedRecipe) => {
        // Update the favorite recipes cache
        const favoriteRecipes = this.favoriteRecipesSubject$.getValue();
        const updatedFavoriteRecipes = favoriteRecipes.map(recipe =>
          recipe.id === recipeId ? updatedRecipe : recipe
        );
        this.favoriteRecipesSubject$.next(updatedFavoriteRecipes);

        // Update the family recipes cache if familyId exists
        if (update.familyId) {
          const familyRecipes = this.familyRecipesSubject$.getValue();
          const updatedFamilyRecipes = familyRecipes.map(recipe =>
            recipe.id === recipeId ? updatedRecipe : recipe
          );
          this.familyRecipesSubject$.next(updatedFamilyRecipes);
        }
      }),
      catchError((error) => {
        console.error('Failed to update recipe:', error);
        return throwError(() => error);
      })
    );
  }

  deleteRecipeFromFavorites(userId: number, recipeId: number): Observable<void> {
    return this.recipeService.removeRecipeFromFavorites(userId, recipeId).pipe(
      tap(() => {
        const currentRecipes = this.favoriteRecipesSubject$.getValue();
        const updatedRecipes = currentRecipes.filter(recipe => recipe.id !== recipeId);
        this.favoriteRecipesSubject$.next(updatedRecipes);
      }),
      map(() => void 0),
      catchError((error) => {
        console.error('Failed to delete recipe:', error);
        return throwError(() => error);
      })
    );
  }

}
