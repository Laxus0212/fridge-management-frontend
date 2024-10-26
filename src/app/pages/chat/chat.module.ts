import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ChatComponent} from './chat.component';
import {IonicModule} from '@ionic/angular';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';



@NgModule({
  declarations: [ChatComponent],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: ChatComponent }]),
    ReactiveFormsModule
  ],
  providers: [provideHttpClient(withInterceptorsFromDi())]
})
export class ChatModule { }
