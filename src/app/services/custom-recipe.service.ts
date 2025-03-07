import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import OpenAI from 'openai';

@Injectable({
  providedIn: 'root'
})
export class CustomRecipeService {
  private apiUrl = 'https://api.openai.com/v1/chat/completions';
  private apiKey = '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'; // Replace with your OpenAI API key

  openai = new OpenAI({
    apiKey: this.apiKey,
    dangerouslyAllowBrowser: true
  });


  constructor(private http: HttpClient) {
  }

  async getRecipeSuggestions(ingredients: string[], mealType: string | null): Promise<any[]> {
    const prompt = this.createRecipePrompt(ingredients, mealType);
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No response content from model.");
      }
      const recipes = this.parseRecipes(content);

      if (!Array.isArray(recipes) || recipes.length === 0) {
        console.warn("Unexpected recipe format from model.");
        return [];
      }

      return recipes.map(recipe => ({
        title: recipe.title || "Untitled Recipe",
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || "No instructions provided",
        description: recipe.description || "No description provided"
      }));
    } catch (error) {
      console.error("Error fetching recipe suggestions:", error);
      return [];
    }
  }

  private createRecipePrompt(ingredients: string[], mealType: string | null): string {
    const ingredientsText = ingredients.join(', ');
    return `Provide three recipes in JSON format. Each recipe should have:
  - title: a string
  - ingredients: an array of strings for each ingredient
  - instructions: a string with step-by-step instructions
  - description: a brief description of the recipe

Use the following ingredients: ${ingredientsText} for a ${mealType ? mealType : 'general'} meal. Output the JSON array only.`;
  }

  private parseRecipes(content: string): any[] {
    try {
      return JSON.parse(content);
    } catch (error) {
      console.error("Failed to parse recipe response as JSON:", error);
      return [];
    }
  }
}
