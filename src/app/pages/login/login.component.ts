import {AfterViewInit, Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {AuthService} from "../../services/auth.service";
import {CommonService} from "../../services/common.service";
import {LoginUserReq, UserService} from '../../openapi/generated-src';
import {GoogleAuth} from '@codetrix-studio/capacitor-google-auth';
import {isPlatform} from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit {
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
    void GoogleAuth.initialize({
      scopes: ['profile', 'email'],
      clientId: '277078751696-4l4jj3i8aijahnujtg8eg45l61inb6bu.apps.googleusercontent.com',
      grantOfflineAccess: true,
    });
    console.log('Google Auth initialized');
    console.log(GoogleAuth)
  }

  ngAfterViewInit(): void {
    this.renderGoogleSignInButton();
  }

  renderGoogleSignInButton() {
    (window as any).google.accounts.id.initialize({
      client_id: '277078751696-4l4jj3i8aijahnujtg8eg45l61inb6bu.apps.googleusercontent.com',
      callback: (response: any) => this.handleCredentialResponse(response),
      auto_select: false,
      itp_support: true,
    });

    (window as any).google.accounts.id.renderButton(
      document.getElementById('google-login-button'), {}
    );
  }

  // handleGoogleSignIn() {
  //   const googleButtonContainer = document.getElementById('google-login-button');
  //   if (googleButtonContainer) {
  //     const googleButton = googleButtonContainer.querySelector("div[role='button']") as HTMLElement;
  //     if (googleButton) {
  //       googleButton.click();
  //     }
  //   }
  // }

  async handleGoogleSignIn(): Promise<void> {
      const googleUser = await GoogleAuth.signIn().then(
        (user) => {
          console.log('Google User:', user);
          return user;
        }
      );


      const responseLikeWeb = {
        clientId: '277078751696-4l4jj3i8aijahnujtg8eg45l61inb6bu.apps.googleusercontent.com',
        credential: googleUser.authentication.idToken,
        select_by: 'user'
      };

      this.handleCredentialResponse(responseLikeWeb); // ugyanaz, mint weben
  }

  public navigatetoRegistration(): void {
    void this.router.navigate(['/register']);
  }

  handleCredentialResponse(response: any) {
    this.userService.usersGooglePost(response).subscribe(
      {
        next: (res) => {
          console.log('Backend Response:', res);
          this.authService.storeLoggedInUserData();
        },
        error: (error) => {
          console.error('Google Login Error:', error);
        }
      }
    );
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
