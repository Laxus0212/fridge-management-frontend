import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {HomeComponent} from "./home.component";
import {IonicModule} from "@ionic/angular";
import {FormsModule} from "@angular/forms";
import {RouterModule} from "@angular/router";
import {provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";


@NgModule({
  declarations: [HomeComponent],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    RouterModule.forChild([{path: '', component: HomeComponent}]),
  ],
  providers: [provideHttpClient(withInterceptorsFromDi())]
})
export class HomeModule { }
