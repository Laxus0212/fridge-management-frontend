import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FamilyComponent} from "./family.component";
import {IonicModule} from "@ionic/angular";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {RouterModule} from "@angular/router";



@NgModule({
  declarations: [FamilyComponent],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    RouterModule.forChild([{path: '', component: FamilyComponent}]),
    ReactiveFormsModule,
  ]
})
export class FamilyModule { }
