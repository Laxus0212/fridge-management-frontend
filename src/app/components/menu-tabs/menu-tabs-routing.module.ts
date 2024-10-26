import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MenuTabsComponent } from './menu-tabs.component';

const routes: Routes = [
  {
    path: '',
    component: MenuTabsComponent,
    children: [
      {
        path: 'fridges',
        loadChildren: () => import('../../pages/fridge/fridge.module').then(m => m.FridgeModule)
      },
      {
        path: 'shopping-list',
        loadChildren: () => import('../../pages/shopping-list/shopping-list.module').then(m => m.ShoppingListModule)
      },
      {
        path: 'recipes',
        loadChildren: () => import('../../pages/recipes/recipes.module').then(m => m.RecipesModule)
      },
      {
        path: 'chat',
        loadChildren: () => import('../../pages/chat/chat.module').then(m => m.ChatModule)
      },
      {
        path: 'account',
        loadChildren: () => import('../../pages/account/account.module').then(m => m.AccountModule)
      },
      {
        path: '',
        redirectTo: '/fridges',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MenuTabsRoutingModule {}
