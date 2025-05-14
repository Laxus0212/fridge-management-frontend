import {Component, OnInit} from '@angular/core';
import {ModalController} from '@ionic/angular';
import {Fridge, FridgeService, Recipe, ShelfService, UpdateRecipe} from '../../openapi/generated-src';
import {CommonService} from 'src/app/services/common.service';
import {AuthService} from 'src/app/services/auth.service';
import {CustomRecipeService} from '../../services/custom-recipe.service';
import {CacheService} from '../../services/cache.service';
import {Ingredient} from '../../openapi/generated-src/model/ingredient';
import {AbstractPage} from '../abstract-page';
import {BehaviorSubject, combineLatest, filter, forkJoin, map, Observable, of, switchMap} from 'rxjs';

@Component({
  selector: 'app-recipes',
  templateUrl: './recipes.component.html',
  styleUrls: ['./recipes.component.scss'],
})
export class RecipesComponent extends AbstractPage implements OnInit {
  ingredientsList: Ingredient[] = [];
  customIngredients: any[] = [];
  selectedIngredients: string[] = [];
  selectedMealType: 'reggeli' | 'ebéd' | 'vacsora' | null = null;
  newIngredientName: string = '';
  newIngredientQuantity: number | null = null;
  newIngredientUnit: string | null = null;
  ingredientUnits = ['g', 'kg', 'ml', 'l', 'pcs', 'dkg', 'dl'];
  suggestedRecipes: any[] = [];
  searched = false;
  isRecipeModalOpen = false;
  selectedRecipe: any = null;
  loading = false;

  selectedTab: 'gpt' | 'favorites' = 'gpt';
  favoriteRecipes: Recipe[] = [];
  familySharedRecipes: Recipe[] = [];
  filteredFavorites: Recipe[] = [];
  filterOption: 'own' | 'family' = 'own';

  favoriteRecipes$: Observable<Recipe[]> = of([]);
  familyRecipes$: Observable<Recipe[]> = of([]);

  filteredFavorites$: Observable<Recipe[]> = of([]);
  private customIngredients$ = new BehaviorSubject<Ingredient[]>([]);

  constructor(
    private recipeService: CustomRecipeService,
    private shelfProductService: ShelfService,
    override commonService: CommonService,
    override authService: AuthService,
    private fridgeService: FridgeService,
    private modalController: ModalController,
    override cacheService: CacheService
  ) {
    super(authService, cacheService, commonService);
  }

  override ngOnInit() {
    super.ngOnInit();

    this.cacheService.getFavoriteRecipes(this.userId!).subscribe((recipes: Recipe[]) => {
      this.favoriteRecipes = recipes;
      this.applyFavoritesFilter();
    });

    this.cacheService.getFamilyRecipes(this.userId!, this.familyId!).subscribe((recipes: Recipe[]) => {
      this.familySharedRecipes = recipes;
      this.applyFavoritesFilter();
    });

    this.favoriteRecipes$ = this.cacheService.getFavoriteRecipes(this.userId!);
    this.familyRecipes$ = this.cacheService.getFamilyRecipes(this.userId!, this.familyId!);
    this.filteredFavorites$ = this.getFilteredFavorites();

    //this.cacheService.loadAllFridgeProducts();
    //this.loadFridgeIngredients();

    this.cacheService.getAllFridgeProducts().pipe(
      filter(products => products.length > 0)
    ).subscribe((products) => {
      this.ingredientsList = products.map(product => ({
        ingredient_name: product.productName,
      }));
    });
  }

  private getFilteredFavorites() {
    return combineLatest([this.favoriteRecipes$, this.familyRecipes$]).pipe(
      map(([favorites, family]) => [...favorites, ...family])
    );
  }

  ingredientsList$: Observable<Ingredient[]> = combineLatest([
    this.cacheService.getAllFridgeProducts().pipe(
      filter(products => products.length > 0),
      map(products => products.map(p => ({ ingredient_name: p.productName })))
    ),
    this.customIngredients$
  ]).pipe(
    map(([fromFridge, custom]) => {
      const combined: Ingredient[] = [...fromFridge];
      custom.forEach(cust => {
        if (!combined.some(i => i.ingredient_name?.toLowerCase() === cust.ingredient_name?.toLowerCase())) {
          combined.push(cust);
        }
      });
      return combined;
    })
  );

  applyFavoritesFilter() {
    const all = [...this.favoriteRecipes, ...this.familySharedRecipes];

    this.filteredFavorites = all.filter(recipe => {
      const matchType = this.selectedMealType ? recipe.mealType === this.selectedMealType : true;
      const matchOwnership = this.filterOption === 'own'
        ? recipe.savedBy === this.userId
        : recipe.familyId === this.authService.getUserFamilyId() && recipe.savedBy !== this.userId;

      return matchType && matchOwnership;
    });
  }

  loadAllProductsFromFridges() {
    this.cacheService.getFridges().pipe(
      filter(fridges => fridges.length > 0),
      switchMap(fridges => {
        const shelvesRequests = fridges.map(fridge => this.cacheService.loadShelves(fridge.fridgeId!));
        return forkJoin(shelvesRequests);
      }),
      switchMap(() => this.cacheService.getShelves()),
      switchMap(shelves => {
        const productsRequests = shelves.map(shelf => this.cacheService.loadShelfProducts(shelf.shelfId!));
        return forkJoin(productsRequests);
      }),
      switchMap(() => this.cacheService.getShelfProducts()),
      map(products => {
        products.forEach(product => {
          if (!this.ingredientsList.some(ing => ing.ingredient_name === product.productName)) {
            this.ingredientsList.push({ ingredient_name: product.productName });
          }
        });
      })
    ).subscribe();
  }

  reloadRecipes() {
    if (this.userId) {
      this.cacheService.loadFavoriteRecipes(this.userId);
      if (this.familyId){
        this.cacheService.loadFamilyRecipes(this.userId, this.familyId);
      }
      this.filteredFavorites$ = this.getFilteredFavorites();
      void this.commonService.presentToast('Recipes reloaded!', 'success');
    } else {
      void this.commonService.presentToast('User not found', 'danger');
    }
  }

  loadFridgeIngredients() {
    this.loadAllProductsFromFridges();
  }

  saveRecipeToFavorites(recipe: any) {
    if (!this.userId) {
      void this.commonService.presentToast('User not found', 'danger');
      return;
    }

    const createRecipeDto = {
      title: recipe.title,
      description: recipe.description,
      instructions: recipe.instructions,
      ingredients: recipe.ingredients,
      savedBy: this.userId,
      mealType: this.selectedMealType ?? undefined,
    };

    this.cacheService.saveRecipeToFavorites(createRecipeDto).subscribe({
      next: () => {
        void this.commonService.presentToast('Recipe added to favorites!', 'success');
        this.closeRecipeModal();
      },
      error: (error) => {
        console.error('Failed to save recipe:', error);
        void this.commonService.presentToast('Failed to add to favorites', 'danger');
      }
    });
  }

  addCustomIngredient() {
    if (this.newIngredientName) {
      const newIngredient = { ingredient_name: this.newIngredientName };

      const current = this.customIngredients$.value;
      const exists = current.some(
        ing => ing.ingredient_name?.toLowerCase() === this.newIngredientName.toLowerCase()
      );

      if (!exists) {
        this.customIngredients$.next([...current, newIngredient]);
      }

      this.newIngredientName = '';
    }
  }

  isInFavorites(recipe: Recipe): boolean {
    return this.favoriteRecipes.some(r => r.title === recipe.title)
      || this.familySharedRecipes.some(r => r.title === recipe.title);
  }

  getRecipeSuggestions() {
    this.loading = true;
    this.suggestedRecipes = [];
    const ingredients = [
      ...this.selectedIngredients,
      ...this.customIngredients.map(i => i.ingredient_name)
    ];

    this.recipeService.getRecipeSuggestions(ingredients, this.selectedMealType).then(
      (suggestions: any) => {
        this.suggestedRecipes = suggestions;
        this.searched = true;
        this.loading = false;
      }
    ).catch(
      () => {
        void this.commonService.presentToast('Error fetching recipes', 'danger');
        this.loading = false;
      }
    );
  }

  loadMoreRecipes() {
    this.loading = true;
    const ingredients = [
      ...this.selectedIngredients,
      ...this.customIngredients.map(i => i.ingredient_name)
    ];

    this.recipeService.getRecipeSuggestions(ingredients, this.selectedMealType).then(
      (newSuggestions: any) => {
        this.suggestedRecipes = [...this.suggestedRecipes, ...newSuggestions];
        this.loading = false;
      }
    ).catch(
      () => {
        void this.commonService.presentToast('Error fetching more recipes', 'danger');
        this.loading = false;
      }
    );
  }

  openRecipeModal(recipe: any) {
    this.selectedRecipe = {
      ...recipe,
      ingredients: Array.isArray(recipe.ingredients)
        ? recipe.ingredients
        : JSON.parse(recipe.ingredients)
    };
    this.isRecipeModalOpen = true;
  }

  closeRecipeModal() {
    this.isRecipeModalOpen = false;
    this.selectedRecipe = null;
  }

  isOwnRecipe(recipe: Recipe): boolean {
    return recipe.savedBy === this.userId;
  }

  deleteRecipe(recipe: Recipe) {
    if (!this.userId || !recipe.id) return;

    this.cacheService.deleteRecipeFromFavorites(this.userId, recipe.id).subscribe({
      next: () => {
        void this.commonService.presentToast(`\u{1F5D1}\uFE0F '${recipe.title}' removed from favorites`, 'success');
        this.favoriteRecipes = this.favoriteRecipes.filter(r => r.id !== recipe.id);
        this.applyFavoritesFilter();
      },
      error: () => {
        void this.commonService.presentToast(`Failed to remove '${recipe.title}'`, 'danger');
      }
    });
  }

  toggleFamilyShare(recipe: Recipe) {
    if (!recipe.id) return;
    const update: UpdateRecipe = {
      familyId: recipe.familyId ? undefined : this.familyId ?? null
    };

    this.cacheService.updateRecipe(recipe.id, this.userId!, update).subscribe({
      next: () => {
        const msg = update.familyId ? `\u{1F91D} '${recipe.title}' shared with family` : `\u{1F464} '${recipe.title}' unshared from family`;
        void this.commonService.presentToast(msg, 'success');
      },
      error: () => {
        void this.commonService.presentToast(`Failed to update sharing for '${recipe.title}'`, 'danger');
      }
    });
  }
}
