import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {NotificationsComponent} from "./notifications.component";
import {IonicModule} from "@ionic/angular";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {RouterModule} from "@angular/router";



@NgModule({
  declarations: [NotificationsComponent],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    RouterModule.forChild([{path: '', component: NotificationsComponent}]),
    ReactiveFormsModule,
  ]
})
export class NotificationsModule { }
