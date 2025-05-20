import {environment} from "../../environments/environment";

const BASE_URL: string = environment.BASE_URL;

export enum RoutePaths {
  Users = 'users',
  Register = 'register',
  Fridges = 'fridges',
  Login = 'login',
  ShoppingList = 'shopping-list',
  Fridge = 'fridge',
  Home = 'home',
  Shelf = 'shelf',
  ShelfProduct = 'shelf-product',
  Account = 'account',
  Family = 'family',
  Error = 'error',
  Notifications = 'notifications',
}
