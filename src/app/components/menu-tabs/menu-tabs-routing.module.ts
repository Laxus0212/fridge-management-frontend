import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MenuTabsComponent } from './menu-tabs.component';
import {AuthGuard} from '../../guards/auth.guard';

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
        loadChildren: () => import('../../pages/recipes/recipes.module').then(m => m.RecipesModule), canActivate: [AuthGuard]
      },
      {
        path: 'chat',
        loadChildren: () => import('../../pages/chat/chat.module').then(m => m.ChatModule), canActivate: [AuthGuard]
      },
      {
        path: 'account',
        loadChildren: () => import('../../pages/account/account.module').then(m => m.AccountModule, ), canActivate: [AuthGuard]
      },
      {
        path: 'family',
        loadChildren: () => import('../../pages/family/family.module').then(m => m.FamilyModule), canActivate: [AuthGuard]
      },
      {
        path: 'error',
        loadChildren: () => import('../../pages/error/error.module').then(m => m.ErrorModule)
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
