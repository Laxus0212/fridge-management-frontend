import {Component, OnInit} from '@angular/core';
import {FormGroup, NonNullableFormBuilder, Validators} from "@angular/forms";
import {AuthService} from "../../services/auth.service";
import {CommonService} from "../../services/common.service";
import {PasswordValidator} from "../../components/validators/password-validator";
import {User, UserService} from '../../openapi/generated-src';
import {AbstractPage} from '../abstract-page';
import {CacheService} from '../../services/cache.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
})
export class AccountComponent extends AbstractPage implements OnInit {
  accountForm!: FormGroup;
  originalPassword: string = '';

  emailErrorText = 'Email is required.';
  usernameErrorText = 'Username is required.';
  passwordErrorText = 'Password is required.';
  passwordRepeatErrorText = 'Passwords must match.';

  constructor(
    private userService: UserService,
    private formBuilder: NonNullableFormBuilder,
    authService: AuthService,
    commonService: CommonService,
    cacheService: CacheService,
  ) {
    super(authService, cacheService, commonService);
  }

  override ngOnInit() {
    super.ngOnInit();
    this.initForm();
    this.authService.userId$.subscribe((userId) => {
      if (userId) {
        this.userId = userId;
        this.loadUserData();
      } else {
        this.accountForm.reset();
      }
    });
  }

  initForm() {
    this.accountForm = this.formBuilder.group({
      email: this.formBuilder.control('', {validators: [Validators.required, Validators.email], updateOn: 'blur'}),
      username: this.formBuilder.control('', {
        validators: [Validators.required, Validators.minLength(4)],
        updateOn: 'blur'
      }),
      password: this.formBuilder.control('', {validators: [Validators.minLength(6)], updateOn: 'blur'}),
      password_repeat: this.formBuilder.control('', {updateOn: 'blur'})
    }, {validators: PasswordValidator.areNotEqual});

    this.accountForm.valueChanges.subscribe(() => {
      this.checkValidation();
    });
  }

  loadUserData() {
    if (this.userId) {
      this.accountForm.patchValue({
        email: this.authService.getEmail(),
        username: this.authService.getUsername(),
      });
    }
  }

  checkValidation() {
    const emailControl = this.accountForm.get('email');
    if (emailControl?.touched && emailControl?.invalid) {
      this.emailErrorText = emailControl.errors?.['required'] ? 'Email is required.' : 'Please enter a valid email.';
    }

    const usernameControl = this.accountForm.get('username');
    if (usernameControl?.touched && usernameControl.invalid) {
      this.usernameErrorText = usernameControl.errors?.['required']
        ? 'Username is required.'
        : 'Username must be at least 4 characters long.';
    }

    const passwordControl = this.accountForm.get('password');
    if (passwordControl?.touched && passwordControl.invalid) {
      this.passwordErrorText = passwordControl.errors?.['minlength']
        ? 'Password must be at least 6 characters long.'
        : '';
    }

    const passwordRepeatControl = this.accountForm.get('password_repeat');
    if (passwordRepeatControl?.touched && this.accountForm.hasError('passwordsDoNotMatch')) {
      this.passwordRepeatErrorText = 'Passwords must match.';
    }
  }

  isAccountFormValid(): boolean {
    let valid = false;
    const isEmailValid = this.accountForm.get('email')?.valid ?? false;
    const isUsernameValid = this.accountForm.get('username')?.valid ?? false;
    const isPasswordValid = this.accountForm.get('password')?.valid ?? true; // Password nem kötelező, ezért alapból true
    const isPasswordRepeatValid = this.accountForm.get('password_repeat')?.valid ?? true; // Password repeat nem kötelező, ezért alapból true
    const isPasswordMatchValid = !this.accountForm.errors?.['passwordsDoNotMatch'] ?? true;

    valid = isEmailValid && isUsernameValid && isPasswordValid && isPasswordRepeatValid && isPasswordMatchValid;
    return valid;
  }


  async updateAccount() {
    if (this.isAccountFormValid()) {
      const {email, username, password} = this.accountForm.value;
      const updatedUser: User = {
        userId: this.userId!,
        email,
        username,
        password: password || undefined,
        familyId: this.familyId!,
      };

      if (this.userId) {
        this.userService.updateUserById(this.userId, updatedUser).subscribe({
          next: () => {
            this.authService.setUsername(updatedUser.username!);
            if (updatedUser.familyId) {
              this.authService.setUserFamilyId(updatedUser.familyId);
            }
            this.commonService.presentToast('Account updated successfully.', 'success');
          },
          error: (error) => {
            this.commonService.presentToast(error.error.message, 'danger');
          },
        });
      }
    } else {
      await this.commonService.presentToast('Please fill out the form correctly.', 'danger');
    }
  }
}
