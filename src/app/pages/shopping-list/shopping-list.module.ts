import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ShoppingListComponent} from "./shopping-list.component";
import {IonicModule} from "@ionic/angular";
import {RouterModule} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";

@NgModule({
  declarations: [ShoppingListComponent],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: ShoppingListComponent }])
  ],
  providers: [provideHttpClient(withInterceptorsFromDi())]
})
export class ShoppingListModule { }
