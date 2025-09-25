import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { FinancialDataService } from '../../services/financial-data.service';


@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class SignupComponent implements OnInit {
  signupForm: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  currentStep = 1;
  totalSteps = 3;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private firestore: Firestore,
    private financialDataService: FinancialDataService
  ) {
    this.signupForm = this.fb.group({
    
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      
      
      password: ['', [Validators.required, Validators.minLength(8), this.passwordValidator]],
      confirmPassword: ['', [Validators.required]],
      
      
      monthlyIncome: ['', [Validators.required, Validators.min(0)]],
      financialGoals: [[], [Validators.required]],
      termsAccepted: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {}

  passwordValidator(control: AbstractControl): {[key: string]: any} | null {
    const value = control.value;
    if (!value) return null;
    
    const hasNumber = /[0-9]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasSpecial = /[#?!@$%^&*-]/.test(value);
    
    const valid = hasNumber && hasUpper && hasLower && hasSpecial;
    if (!valid) {
      return { passwordStrength: true };
    }
    return null;
  }

  passwordMatchValidator(group: AbstractControl): {[key: string]: any} | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  nextStep(): void {
    if (this.isStepValid()) {
      this.currentStep++;
    } else {
      this.markCurrentStepTouched();
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  isStepValid(): boolean {
    const step1Fields = ['firstName', 'lastName', 'email'];
    const step2Fields = ['password', 'confirmPassword'];
    const step3Fields = ['monthlyIncome', 'financialGoals', 'termsAccepted'];
    
    let fieldsToCheck: string[] = [];
    
    switch (this.currentStep) {
      case 1:
        fieldsToCheck = step1Fields;
        break;
      case 2:
        fieldsToCheck = step2Fields;
        break;
      case 3:
        fieldsToCheck = step3Fields;
        break;
    }
    
    return fieldsToCheck.every(field => {
      const control = this.signupForm.get(field);
      return control && control.valid;
    }) && (this.currentStep !== 2 || !this.signupForm.hasError('passwordMismatch'));
  }

  markCurrentStepTouched(): void {
    const step1Fields = ['firstName', 'lastName', 'email'];
    const step2Fields = ['password', 'confirmPassword'];
    const step3Fields = ['monthlyIncome', 'financialGoals', 'termsAccepted'];
    
    let fieldsToMark: string[] = [];
    
    switch (this.currentStep) {
      case 1:
        fieldsToMark = step1Fields;
        break;
      case 2:
        fieldsToMark = step2Fields;
        break;
      case 3:
        fieldsToMark = step3Fields;
        break;
    }
    
    fieldsToMark.forEach(field => {
      this.signupForm.get(field)?.markAsTouched();
    });
  }

  toggleGoal(goal: string): void {
    const goals = this.signupForm.get('financialGoals')?.value || [];
    const index = goals.indexOf(goal);
    
    if (index > -1) {
      goals.splice(index, 1);
    } else {
      goals.push(goal);
    }
    
    this.signupForm.patchValue({ financialGoals: goals });
  }

  isGoalSelected(goal: string): boolean {
    const goals = this.signupForm.get('financialGoals')?.value || [];
    return goals.includes(goal);
  }

async onSubmit(): Promise<void> {
  if (!this.signupForm.valid) {
    this.markCurrentStepTouched();
    return;
  }

  this.isLoading = true;
  const formData = this.signupForm.value;

  try {
  
    const userCredential = await this.authService.signup(
      formData.email,
      formData.password,
      {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        monthlyIncome: formData.monthlyIncome,
        financialGoals: formData.financialGoals
      }
    );

    const user = userCredential.user;
    if (!user) throw new Error('User signup failed');

   
    const userDocRef = doc(this.firestore, `users/${user.uid}`);
    await setDoc(userDocRef, {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      monthlyIncome: formData.monthlyIncome,
      financialGoals: formData.financialGoals,
      avatarUrl: user.photoURL || null,
      createdAt: new Date()
    });

    
  const defaultBudgets = [
  { category: 'Food & Dining', monthlyLimit: 800, color: '#4F46E5' },
  { category: 'Transportation', monthlyLimit: 400, color: '#06B6D4' },
  { category: 'Entertainment', monthlyLimit: 300, color: '#8B5CF6' },
  { category: 'Shopping', monthlyLimit: 600, color: '#F59E0B' }
];

try {
  await this.financialDataService.createMonthlyBudgets(defaultBudgets, userCredential.user.uid);
} catch (error) {
  console.error('Budget creation error:', error);
  
}

this.router.navigate(['/dashboard']);
console.log('Signup successful:', userCredential.user);

  } catch (error: any) {
    console.error('Signup error:', error);
    this.showError(error.message);
  } finally {
    this.isLoading = false;
  }
}


showError(message: string): void {

  alert(message); 
}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToHome(): void {
    this.router.navigate(['']);
  }

  getFieldError(fieldName: string): string {
    const field = this.signupForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['min']) return `${fieldName} must be greater than 0`;
      if (field.errors['passwordStrength']) return 'Password must contain uppercase, lowercase, number and special character';
      if (field.errors['requiredTrue']) return 'You must accept the terms and conditions';
    }
    
    if (fieldName === 'confirmPassword' && this.signupForm.hasError('passwordMismatch') && field?.touched) {
      return 'Passwords do not match';
    }
    
    return '';
  }

     
    hasUppercase(): boolean {
      const value = this.signupForm.get('password')?.value || '';
      return /[A-Z]/.test(value);
    }

    hasLowercase(): boolean {
      const value = this.signupForm.get('password')?.value || '';
      return /[a-z]/.test(value);
    }

    hasNumber(): boolean {
      const value = this.signupForm.get('password')?.value || '';
      return /[0-9]/.test(value);
    }

    hasSpecialChar(): boolean {
      const value = this.signupForm.get('password')?.value || '';
      return /[#?!@$%^&*-]/.test(value);
    }

}