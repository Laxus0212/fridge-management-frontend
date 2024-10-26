import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {AuthGuard} from "../../guards/auth.guard";
import {FridgeComponent} from "./fridge.component";
import {ShelfRoutingModule} from "../shelf/shelf-routing.module";

const routes: Routes = [
  { path: '',
    component: FridgeComponent,
    canActivate: [AuthGuard],
  },
  { path: 'shelf', loadChildren: () => import('../shelf/shelf.module').then(m => m.ShelfModule), canActivate: [AuthGuard] },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class FridgeRoutingModule { }
