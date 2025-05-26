import {Component, OnInit} from '@angular/core';
import {ActionSheetController, ModalController} from '@ionic/angular';
import {Fridge, FridgeService, Recipe, ShelfService, UpdateRecipe} from '../../openapi/generated-src';
import {CommonService} from 'src/app/services/common.service';
import {AuthService} from 'src/app/services/auth.service';
import {CustomRecipeService} from '../../services/custom-recipe.service';
import {CacheService} from '../../services/cache.service';
import {AbstractPage} from '../abstract-page';
import {BehaviorSubject, combineLatest, filter, forkJoin, map, Observable, of, switchMap} from 'rxjs';

@Component({
  selector: 'app-recipes',
  templateUrl: './recipes.component.html',
  styleUrls: ['./recipes.component.scss'],
})
export class RecipesComponent extends AbstractPage implements OnInit {
  ingredientsList: string[] = [];
  customIngredients: string[] = [];
  selectedIngredients: string[] = [];
  selectedMealType: 'reggeli' | 'ebéd' | 'vacsora' | null = null;
  newIngredientName: string = '';
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
  private customIngredients$ = new BehaviorSubject<string[]>([]);

  constructor(
    private recipeService: CustomRecipeService,
    override commonService: CommonService,
    override authService: AuthService,
    override cacheService: CacheService,
    private actionSheetController: ActionSheetController
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

    this.cacheService.getAllFridgeProducts().pipe(
      filter(products => products.length > 0)
    ).subscribe((products) => {
      this.ingredientsList = products.map(product => (
        product.productName
      ));
    });
  }

  private getFilteredFavorites() {
    return combineLatest([this.favoriteRecipes$, this.familyRecipes$]).pipe(
      map(([favorites, family]) => [...favorites, ...family])
    );
  }

  ingredientsList$: Observable<string[]> = combineLatest([
    this.cacheService.getAllFridgeProducts().pipe(
      filter(products => products.length > 0),
      map(products => products.map(p => (p.productName )))
    ),
    this.customIngredients$
  ]).pipe(
    map(([fromFridge, custom]) => {
      const combined: string[] = [...fromFridge];
      custom.forEach(cust => {
        if (!combined.some(i => i.toLowerCase() === cust.toLowerCase())) {
          combined.push(cust);
        }
      });
      return combined;
    })
  );

  applyFavoritesFilter() {
    const allRecipes = [...this.favoriteRecipes, ...this.familySharedRecipes];

    this.filteredFavorites = allRecipes.filter(recipe => {
      const matchOwnership = this.filterOption === 'own'
        ? recipe.savedBy === this.userId
        : recipe.familyId === this.familyId && recipe.savedBy !== this.userId;

      const matchMealType = this.selectedMealType
        ? recipe.mealType === this.selectedMealType
        : true;

      return matchOwnership && matchMealType;
    });

    this.filteredFavorites$ = of(this.filteredFavorites);
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
      const newIngredient = this.newIngredientName;

      const current = this.customIngredients$.value;
      const exists = current.some(
        ing => ing.toLowerCase() === this.newIngredientName.toLowerCase()
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
      ...this.customIngredients$.value,
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
      ...this.customIngredients$.value
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

  async presentDeleteConfirmation(recipe: Recipe | undefined) {
    if (!recipe) return;

    const actionSheet = await this.actionSheetController.create({
      header: 'Delete Recipe',
      subHeader: 'Are you sure you want to delete this recipe?',
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            this.deleteRecipe(recipe);
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
}
