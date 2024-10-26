import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {IonicModule} from "@ionic/angular";
import {ShelfComponent} from "./shelf.component";
import {RouterModule} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {ShelfRoutingModule} from "./shelf-routing.module";
import {ShelfProductModule} from "../shelf-product/shelf-product.module";
import {ShelfProductComponent} from "../shelf-product/shelf-product.component";

@NgModule({
  declarations: [ShelfComponent],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ShelfRoutingModule,
    ShelfProductModule,
  ]
})
export class ShelfModule { }
