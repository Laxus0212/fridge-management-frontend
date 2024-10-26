import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RegisterComponent} from "./register.component";
import {IonicModule} from "@ionic/angular";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {RouterModule} from "@angular/router";
import {provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";

@NgModule({
  declarations: [RegisterComponent],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: RegisterComponent }]),
    ReactiveFormsModule
  ],
  providers: [provideHttpClient(withInterceptorsFromDi())]
})
export class RegisterModule { }
