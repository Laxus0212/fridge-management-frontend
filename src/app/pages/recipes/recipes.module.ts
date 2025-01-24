import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {IonicModule} from '@ionic/angular';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {RecipesComponent} from './recipes.component';



@NgModule({
  declarations: [RecipesComponent],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: RecipesComponent }]),
    ReactiveFormsModule
  ],
  providers: [provideHttpClient(withInterceptorsFromDi())]
})
export class RecipesModule { }
