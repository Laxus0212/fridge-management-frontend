import {Component, OnInit} from '@angular/core';
import {ModalController} from '@ionic/angular';
import {Fridge, FridgeService, Ingredient, ShelfService} from '../../openapi/generated-src';
import {CommonService} from 'src/app/services/common.service';
import {AuthService} from 'src/app/services/auth.service';
import {CustomRecipeService} from '../../services/custom-recipe.service';

@Component({
  selector: 'app-recipes',
  templateUrl: './recipes.component.html',
  styleUrls: ['./recipes.component.scss'],
})
export class RecipesComponent implements OnInit {
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
  loading = false; // Add loading state
  userId?: number;

  constructor(
    private recipeService: CustomRecipeService,
    private shelfProductService: ShelfService,
    private commonService: CommonService,
    private authService: AuthService,
    private fridgeService: FridgeService,
    private modalController: ModalController
  ) {
  }

  ngOnInit() {
    const uId = this.authService.getUserId();
    this.userId = uId ? uId : undefined;
    this.loadFridgeIngredients();
  }

  loadFridgeIngredients() {
    this.loadUserFridges();
  }

  private loadUserFridges() {
    if (this.userId) {
      this.fridgeService.getUserFridges(this.userId).subscribe({
        next: (fridges: Fridge[]) => {
          if (fridges.length === 0) {
            void void this.commonService.presentToast('No fridge found', 'warning');
            return;
          }
          fridges.forEach(fridge => {
            this.loadShelvesByFridgeId(fridge);
          });
        },
        error: (err) => void this.commonService.presentToast('Error loading fridge', 'danger')
      });
    }else {
      void this.commonService.presentToast('User not found', 'danger');
    }
  }

  loadShelvesByFridgeId(fridge: Fridge) {
    this.shelfProductService.getShelvesByFridgeId(fridge.fridgeId!).subscribe({
      next: (shelves) => {
        shelves.map(shelf => {
          shelf.products?.map(product => {
            if (this.ingredientsList.findIndex(i => i.ingredient_name === product.productName) === -1) {
              this.ingredientsList.push({
                ingredient_name: product.productName
              });
            }
          });
        });
      },
      error: (err) => void this.commonService.presentToast('Error loading shelves', 'danger')
    });
  }

  addCustomIngredient() {
    if (this.newIngredientName) {
      const isThereIngredientWithThisName = this.ingredientsList.find(ingredient =>
        ingredient.ingredient_name?.toLowerCase() === this.newIngredientName.toLowerCase()
      );
      if (!isThereIngredientWithThisName) {
        this.ingredientsList.push({
          ingredient_name: this.newIngredientName
        });
      }
      this.newIngredientName = '';
    }
  }

  getRecipeSuggestions() {
    this.loading = true; // Set loading to true
    this.suggestedRecipes = [];
    const ingredients = [
      ...this.selectedIngredients,
      ...this.customIngredients.map(i => i.ingredient_name)
    ];

    this.recipeService.getRecipeSuggestions(ingredients, this.selectedMealType).then(
      (suggestions: any) => {
        this.suggestedRecipes = suggestions;
        this.searched = true;
        this.loading = false; // Set loading to false
      }
    ).catch(
      (err) => {
        void this.commonService.presentToast('Error fetching recipes', 'danger');
        this.loading = false; // Set loading to false
      }
    );
  }

  loadMoreRecipes() {
    this.loading = true; // Set loading to true
    const ingredients = [
      ...this.selectedIngredients,
      ...this.customIngredients.map(i => i.ingredient_name)
    ];

    this.recipeService.getRecipeSuggestions(ingredients, this.selectedMealType).then(
      (newSuggestions: any) => {
        this.suggestedRecipes = [...this.suggestedRecipes, ...newSuggestions];
        this.loading = false; // Set loading to false
      }
    ).catch(
      (err) => {
        void this.commonService.presentToast('Error fetching more recipes', 'danger');
        this.loading = false; // Set loading to false
      }
    );
  }

  openRecipeModal(recipe: any) {
    this.selectedRecipe = recipe;
    this.isRecipeModalOpen = true;
  }

  closeRecipeModal() {
    this.isRecipeModalOpen = false;
    this.selectedRecipe = null;
  }
}
