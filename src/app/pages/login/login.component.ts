import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import {AuthService} from "../../services/auth.service";
import {RoutePaths} from "../../enums/route-paths";
import {CommonService} from "../../services/common.service";
import {LoginUserReq, UserService} from '../../openapi/generated-src';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  emailErrorText = 'Please enter a valid email';
  passwordErrorText = 'Password is required';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private commonService: CommonService
  ) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }


  onSubmit() {
    if (this.loginForm.valid) {
      const loginData: LoginUserReq = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };
      this.userService.loginUser(loginData).subscribe({
        next: (resp) => {
          console.log('Login successful');
          void this.commonService.presentToast('Login successful!', 'success');
          this.authService.setToken(resp.token!); // Store token
          this.authService.setUsername(resp.user?.username!); // Store username
          this.authService.setUserFamilyId(resp.user?.family_id!); // Store family id
          this.authService.setUserId(resp.user?.user_id!); // Store user id
          void this.router.navigate([RoutePaths.Fridges]); // Redirect after successful login
        },
        error: (resp) => {
          console.error('Login failed:', resp.error.message);
          void this.commonService.presentToast(resp.error.message, 'danger');
        }
      });
    } else {
      void this.commonService.presentToast('Please fill out the form correctly.', 'danger');
    }
  }
}
