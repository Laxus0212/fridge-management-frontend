import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {LoginComponent} from "./login.component";
import {IonicModule} from "@ionic/angular";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {RouterModule} from "@angular/router";
import {provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";

@NgModule({
  declarations: [LoginComponent],
    imports: [
        CommonModule,
        IonicModule,
        RouterModule.forChild([{path: '', component: LoginComponent}]),
        FormsModule,
        ReactiveFormsModule
    ],
  providers: [provideHttpClient(withInterceptorsFromDi())]
})
export class LoginModule { }
