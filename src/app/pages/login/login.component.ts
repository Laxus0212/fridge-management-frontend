import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {AuthService} from "../../services/auth.service";
import {RoutePaths} from "../../enums/route-paths";
import {CommonService} from "../../services/common.service";
import {LoginUserReq, User, UserService} from '../../openapi/generated-src';

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
  ) {
  }

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
      this.authService.login(loginData);
    } else {
      void this.commonService.presentToast('Please fill out the form correctly.', 'danger');
    }
  }
}
