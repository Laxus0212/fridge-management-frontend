import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {AuthGuard} from "../../guards/auth.guard";
import {FridgeComponent} from "./fridge.component";
import {ShelfRoutingModule} from "../shelf/shelf-routing.module";

const routes: Routes = [
  { path: '',
    component: FridgeComponent,
  },
  { path: 'shelf', loadChildren: () => import('../shelf/shelf.module').then(m => m.ShelfModule) },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class FridgeRoutingModule { }
