import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {FridgeComponent} from "./fridge.component";

const routes: Routes = [
  {
    path: '',
    component: FridgeComponent,
  },
  {path: 'shelf', loadChildren: () => import('../shelf/shelf.module').then(m => m.ShelfModule)},
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class FridgeRoutingModule {
}
