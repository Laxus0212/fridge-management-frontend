import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {IonicModule} from "@ionic/angular";
import {FormsModule} from "@angular/forms";
import {RouterModule} from "@angular/router";
import {ShelfProductComponent} from "./shelf-product.component";



@NgModule({
  declarations: [ShelfProductComponent],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    RouterModule.forChild([{path: '', component: ShelfProductComponent}]),
  ]
})
export class ShelfProductModule { }
