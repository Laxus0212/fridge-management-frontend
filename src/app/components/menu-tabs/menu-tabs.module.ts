import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { MenuTabsComponent } from './menu-tabs.component';
import {MenuTabsRoutingModule} from "./menu-tabs-routing.module";

@NgModule({
  declarations: [MenuTabsComponent],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    MenuTabsRoutingModule
  ],
  exports: [
    MenuTabsComponent
  ]
})
export class MenuTabsModule {}
