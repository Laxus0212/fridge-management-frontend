/**
 * Fridge API
 *
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { ShoppingListFamily } from './shoppingListFamily';


export interface ShoppingList { 
    id?: number;
    name: string;
    family_id: number;
    Family?: ShoppingListFamily;
}

