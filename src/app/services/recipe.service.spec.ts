import { TestBed } from '@angular/core/testing';

import { CustomRecipeService } from './custom-recipe.service';

describe('RecipeService', () => {
  let service: CustomRecipeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomRecipeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
