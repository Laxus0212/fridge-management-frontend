import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {AuthGuard} from "../../guards/auth.guard";
import {ShelfComponent} from "./shelf.component";
import {ShelfProductComponent} from "../shelf-product/shelf-product.component";

const routes: Routes = [
  { path: '',
    component: ShelfComponent,
    canActivate: [AuthGuard],
  },
  { path: 'shelf-product', loadChildren: () => import('../shelf-product/shelf-product.module').then(m => m.ShelfProductModule), canActivate: [AuthGuard] },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class ShelfRoutingModule { }
