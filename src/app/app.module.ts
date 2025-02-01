import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouteReuseStrategy} from '@angular/router';

import {IonicModule, IonicRouteStrategy} from '@ionic/angular';

import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {UserBarComponent} from "./components/user-bar/user-bar.component";
import {provideHttpClient, withInterceptors, withInterceptorsFromDi} from "@angular/common/http";
import {MenuTabsModule} from "./components/menu-tabs/menu-tabs.module";
import {HTTP_INTERCEPTORS } from '@angular/common/http';
import {LoginInterceptor} from './login.interceptor';

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
      useClass: IonicRouteStrategy,

    },
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoginInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
