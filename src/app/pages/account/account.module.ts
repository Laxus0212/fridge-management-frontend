import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AccountComponent} from "./account.component";
import {IonicModule} from "@ionic/angular";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {RouterModule} from "@angular/router";
import {HomeComponent} from "../home/home.component";



@NgModule({
  declarations: [AccountComponent],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    RouterModule.forChild([{path: '', component: AccountComponent}]),
    ReactiveFormsModule,
  ]
})
export class AccountModule { }
