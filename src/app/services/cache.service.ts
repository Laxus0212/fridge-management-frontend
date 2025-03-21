import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {
  Chat,
  Family,
  FamilyMember,
  FamilyService,
  Fridge,
  FridgeService,
  GetChatByFamilyId200Response,
  Invitation,
  Product,
  ProductService,
  RegisterUser201Response,
  Shelf,
  ShelfService,
  ShoppingList,
  ShoppingListService,
  UpdateFridgeReq,
  UpdateUserReq,
  User,
  UserService
} from '../openapi/generated-src';

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private fridgeCache$ = new BehaviorSubject<Fridge[]>([]);
  private shoppingListCache$ = new BehaviorSubject<ShoppingList[]>([]);
  private shelfCache$ = new BehaviorSubject<Shelf[]>([]);
  private productCache$ = new BehaviorSubject<Product[]>([]);
  private accountCache$ = new BehaviorSubject<User | null>(null);
  private familyCache$ = new BehaviorSubject<Family | null>(null);
  private chatCache$ = new BehaviorSubject<Chat | null>(null);
  private familyMembersCache$ = new BehaviorSubject<FamilyMember[]>([]);
  private isLoadingSubject$ = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject$.asObservable();

  constructor(
    public fridgeService: FridgeService,
    private shoppingListService: ShoppingListService,
    private shelfService: ShelfService,
    private productService: ProductService,
    private userService: UserService,
    private familyService: FamilyService,
  ) {
  }

  /** Load all fridges for the user and store them in cache */
  loadFridges(userId: number | null, familyId: number | null): void {
    this.isLoadingSubject$.next(true); // Start loading
    this.syncFridges(userId, familyId);
  }

  //clearCache
  clearCache(): void {
    this.fridgeCache$.next([]);
    this.shoppingListCache$.next([]);
    this.shelfCache$.next([]);
    this.productCache$.next([]);
    this.accountCache$.next(null);
    this.familyCache$.next(null);
    this.chatCache$.next(null);
    this.familyMembersCache$.next([]);
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
            this.isLoadingSubject$.next(false); // Stop loading
          }
        },
        error: () => this.isLoadingSubject$.next(false)
      });
    } else {
      this.isLoadingSubject$.next(false);
    }
  }

  //full load
  fullLoad(userId: number | null, familyId: number | null): void {
    this.loadFridges(userId, familyId);
    this.loadShoppingLists(userId);
    this.loadAccountData(userId);
    this.loadFamilyData(familyId);
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
        this.isLoadingSubject$.next(false); // Stop loading
      },
      error: () => this.isLoadingSubject$.next(false)
    });
  }

  /** Load shelves for a specific fridge */
  loadShelves(fridgeId: number): void {
    this.shelfService.getShelvesByFridgeId(fridgeId).subscribe({
      next: (shelves) => this.shelfCache$.next(shelves),
      error: () => {
      }
    });
  }

  /** Load products for a specific shelf */
  loadShelfProducts(shelfId: number): void {
    this.productService.getProductsByShelfId(shelfId).subscribe({
      next: (products) => this.productCache$.next(products),
      error: () => {
      }
    });
  }

  /** Load account data for the logged-in user */
  loadAccountData(userId: number | null): void {
    if (userId) {
      this.userService.getUserById(userId).subscribe({
        next: (user) => this.accountCache$.next(user),
        error: () => {
        }
      });
    }
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
  getChat(familyId: number): Chat {
    if (!this.chatCache$.getValue()) {
      this.familyService.getChatByFamilyId(familyId).subscribe({
        next: (chat: GetChatByFamilyId200Response) => {
          this.chatCache$.next(chat as unknown as Chat);
        },
        error: (error: any) => console.error('Failed to load chat:', error)
      });
    }
    return this.chatCache$.getValue();
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

  addShoppingList(newList: ShoppingList, userId: number | null): void {
    this.shoppingListService.createShoppingList(newList).subscribe({
      next: () => this.loadShoppingLists(userId),
      error: (error) => console.error('Failed to add shopping list:', error),
    });
  }

  updateShoppingList(listId: number, updatedList: ShoppingList, userId: number | null): void {
    this.shoppingListService.updateShoppingList(listId, updatedList).subscribe({
      next: () => this.loadShoppingLists(userId),
      error: (error) => console.error('Failed to update shopping list:', error),
    });
  }

  deleteShoppingList(listId: number, userId: number | null): void {
    this.shoppingListService.deleteShoppingList(listId).subscribe({
      next: () => this.loadShoppingLists(userId),
      error: (error) => console.error('Failed to delete shopping list:', error),
    });
  }

  getShoppingLists(): Observable<ShoppingList[]> {
    return this.shoppingListCache$.asObservable();
  }

  getShelves(): Observable<Shelf[]> {
    return this.shelfCache$.asObservable();
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
}
