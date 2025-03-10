import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import {AuthGuard} from "./guards/auth.guard";

const routes: Routes = [
  { path: '', loadChildren: () => import('./components/menu-tabs/menu-tabs.module').then(m => m.MenuTabsModule) },
  { path: 'home', loadChildren: () => import('./pages/home/home.module').then(m => m.HomeModule) },
  { path: 'login', loadChildren: () => import('./pages/login/login.module').then(m => m.LoginModule) },
  { path: 'register', loadChildren: () => import('./pages/register/register.module').then(m => m.RegisterModule) },
  //{ path: 'fridge', loadChildren: () => import('./pages/fridge/fridge.module').then(m => m.FridgeModule), canActivate: [AuthGuard] },
  ////{ path: 'shopping-list', loadChildren: () => import('./pages/shopping-list/shopping-list.module').then(m => m.ShoppingListModule), canActivate: [AuthGuard] },


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
