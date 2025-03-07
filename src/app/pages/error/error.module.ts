import { NgModule } from '@angular/core';
import {RouterModule} from '@angular/router';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {ErrorComponent} from './error.component';
import {IonicModule} from '@ionic/angular';

@NgModule({
  declarations: [ErrorComponent],
  imports: [
    IonicModule,
    RouterModule.forChild([{ path: '', component: ErrorComponent }]),
  ],
  providers: [provideHttpClient(withInterceptorsFromDi())]
})
export class ErrorModule { }
