import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import {UserBarComponent} from "./components/user-bar/user-bar.component";
import {provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";
import {MenuTabsModule} from "./components/menu-tabs/menu-tabs.module";

@NgModule({
  declarations: [
    AppComponent,
    UserBarComponent
  ],
    imports: [
        BrowserModule,
        IonicModule.forRoot(),
        AppRoutingModule,
        MenuTabsModule,
    ],
  providers: [
    {
      provide: RouteReuseStrategy,
      useClass: IonicRouteStrategy
    },
    provideHttpClient(withInterceptorsFromDi()),
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
