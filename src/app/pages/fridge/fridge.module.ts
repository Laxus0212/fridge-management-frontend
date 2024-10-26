import { NgModule } from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FridgeComponent} from "./fridge.component";
import {IonicModule} from "@ionic/angular";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";
import {FridgeRoutingModule} from "./fridge-routing.module";
import {ShelfModule} from "../shelf/shelf.module";



@NgModule({
  declarations: [FridgeComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    FridgeRoutingModule,
    NgOptimizedImage,
    ShelfModule
  ],
  providers: [provideHttpClient(withInterceptorsFromDi())]
})
export class FridgeModule { }
