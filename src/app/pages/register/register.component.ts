import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CreateFamilyReq, Family, FamilyService, User, UserService } from "../../openapi/generated-angular-sdk";
import { ToastController } from "@ionic/angular";
import { FormGroup, NonNullableFormBuilder, Validators } from "@angular/forms";
import { PasswordValidator } from "../../components/validators/password-validator";
import {AuthService} from "../../services/auth.service";
import {RoutePaths} from "../../enums/route-paths";
import {CommonService} from "../../services/common.service";

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  families: Family[] = [];

  // Error message variables
  emailErrorText = 'Email is required.';
  usernameErrorText = 'Username is required.';
  passwordErrorText = 'Password is required.';
  confirmPasswordErrorText = 'Passwords do not match.';
  familyErrorText = 'Family name is required.';

  constructor(
    private userService: UserService,
    private familyService: FamilyService,
    private router: Router,
    private commonService: CommonService,
    private formBuilder: NonNullableFormBuilder,
    private authService: AuthService
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.loadFamilies();
  }

  initForm() {
    this.registerForm = this.formBuilder.group({
      email: this.formBuilder.control('', { validators: [Validators.required, Validators.email], updateOn: 'blur' }),
      username: this.formBuilder.control('', { validators: [Validators.required, Validators.minLength(4)], updateOn: 'blur' }),
      password: this.formBuilder.control('', { validators: [Validators.required, Validators.minLength(6)], updateOn: 'blur' }),
      confirmPassword: this.formBuilder.control('', { validators: [Validators.required, PasswordValidator.areNotEqual], updateOn: 'blur' }),
      isNewFamily: this.formBuilder.control(false, { validators: [Validators.required] }),
      familyId: this.formBuilder.control('', { validators: [Validators.required], updateOn: 'blur' }),
      newFamilyName: this.formBuilder.control('', {validators: [Validators.required], updateOn: 'blur'}),
    }, {
      validators: PasswordValidator.areNotEqual
    });

    // Call validation on form changes
    this.registerForm.valueChanges.subscribe(() => {
      this.checkValidation();
    });
  }

  checkValidation() {
    // Check email validity
    const emailControl = this.registerForm.get('email');
    if (emailControl?.touched && emailControl?.invalid) {
      if (emailControl.errors?.['required']) {
        this.emailErrorText = 'Email is required.';
      } else {
        this.emailErrorText = 'Please enter a valid email.';
      }
    }

    // Check username validity
    const usernameControl = this.registerForm.get('username');
    if (usernameControl?.touched && usernameControl.invalid) {
      if (usernameControl.errors?.['required']) {
        this.usernameErrorText = 'Username is required.';
      } else if (usernameControl.errors?.['minlength']) {
        this.usernameErrorText = 'Username must be at least 4 characters long.';
      }
    }

    // Check password validity
    const passwordControl = this.registerForm.get('password');
    if (passwordControl?.touched && passwordControl.invalid) {
      if (passwordControl.errors?.['required']) {
        this.passwordErrorText = 'Password is required.';
      } else if (passwordControl.errors?.['minlength']) {
        this.passwordErrorText = 'Password must be at least 6 characters long.';
      }
    }

    // Check confirm password validity
    const confirmPasswordControl = this.registerForm.get('confirmPassword');
    if (confirmPasswordControl?.dirty && this.registerForm.hasError('passwordMismatch')) {
      confirmPasswordControl.setErrors({ passwordMismatch: true });
      this.confirmPasswordErrorText = 'Passwords do not match.';
    }

    // Check family selection
    const isNewFamilyControl = this.registerForm.get('isNewFamily');
    const newFamilyNameControl = this.registerForm.get('newFamilyName');
    if (isNewFamilyControl?.value && newFamilyNameControl?.touched && newFamilyNameControl?.invalid){
      this.familyErrorText = 'Family name is required.';
    }
  }

  private loadFamilies() {
    this.familyService.getFamilies().subscribe(
      {
        next: (families) => {
          this.families = families;
          if (this.families.length > 0) {
            this.registerForm.get('familyId')?.setValue(this.families[0].id);
          }else {
            this.registerForm.get('isNewFamily')?.setValue(true);
          }
        },
        error: (resp) => {
          console.error('Error fetching families:', resp);
          void this.commonService.presentToast(resp.error.message, 'danger');
        }
      });
  }

  isRegisterFormValid(): boolean {
    let valid = false;
    const { isNewFamily, newFamilyName, familyId } = this.registerForm.value;
    const isEmailValid = this.registerForm.get('email')?.valid ?? false;
    const isUsernameValid = this.registerForm.get('username')?.valid ?? false;
    const isPasswordValid = this.registerForm.get('password')?.valid ?? false;
    const isConfirmPasswordValid = this.registerForm.get('confirmPassword')?.valid ?? false;
    const isPasswordMatchValid = !this.registerForm.errors?.['passwordMismatch'] ?? false;
    const isFamilyValid = isNewFamily ? newFamilyName : familyId;
    valid = isEmailValid && isUsernameValid && isPasswordValid && isConfirmPasswordValid && isPasswordMatchValid && !!isFamilyValid;
    return valid;
  }

  register() {
    if (this.isRegisterFormValid()) {
      const { isNewFamily, newFamilyName, familyId } = this.registerForm.value;
      if (isNewFamily && newFamilyName) {
        const createFamilyReqObj: CreateFamilyReq = { name: newFamilyName };
        this.familyService.createFamily(createFamilyReqObj).subscribe({
          next: (family) => this.createUser(family.id),
          error: (resp) => void this.commonService.presentToast(resp.error.message, 'danger')
        });
      } else if (familyId) {
        this.createUser(familyId);
      } else {
        void this.commonService.presentToast('Please select or create a family.', 'danger');
      }
    } else {
      void this.commonService.presentToast('Please fill out the form correctly.', 'danger');
    }
  }

  createUser(familyId: number) {
    const { email, username, password } = this.registerForm.value;
    const userData: User = {
      email: email,
      username: username,
      password_hash: password,
      family_id: familyId,
    };

    this.userService.registerUser(userData).subscribe({
        next: () => {
          console.log('Registration successful');
          void this.commonService.presentToast('Registration successful!', 'success');
          this.userService.loginUser({ email, password }).subscribe({
            next: (resp) => {
              console.log('Login successful');
              this.authService.setToken(resp.token!); // Store token
              this.authService.setUsername(resp.user?.username!); // Store username
              this.authService.setUserFamilyId(resp.user?.family_id!); // Store family id
              this.authService.setUserId(resp.user?.id!); // Store user id
              void this.router.navigate([RoutePaths.Fridges]); // Redirect after successful login
            },
            error: (resp) => {
              console.error('Login failed:', resp.error.message);
              void this.commonService.presentToast(resp.error.message, 'danger');
            }
          });
        },
        error: (resp) => {
          console.error('Registration failed:', resp);
          void this.commonService.presentToast(resp.error.message, 'danger');
        }
      }
    );
  }
}
