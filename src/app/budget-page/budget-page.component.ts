
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FinancialDataService } from '../../services/financial-data.service';
import { AuthService } from '../../services/auth.service';
import { Firestore, collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';

interface BudgetItem {
  id: string;
  category: string;
  monthlyLimit: number;
  spent: number;
  month: number;
  year: number;
  color: string;
  alertThreshold: number;
}

@Component({
  selector: 'app-budget',
  templateUrl: './budget-page.component.html',
  styleUrls: ['./budget-page.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class BudgetComponent implements OnInit, OnDestroy {
  budgets: BudgetItem[] = [];
  isLoading = true;

  isModalOpen = false;
  editingBudget: BudgetItem | null = null;

  budgetForm: FormGroup;
  private subscription: Subscription | null = null;

  readonly availableCategories = [
    { name: 'Food & Dining', color: '#4F46E5' },
    { name: 'Transportation', color: '#06B6D4' },
    { name: 'Entertainment', color: '#8B5CF6' },
    { name: 'Shopping', color: '#F59E0B' },
    { name: 'Bills & Utilities', color: '#EF4444' },
    { name: 'Healthcare', color: '#10B981' },
    { name: 'Education', color: '#F97316' },
    { name: 'Travel', color: '#84CC16' },
    { name: 'Housing', color: '#6366F1' },
    { name: 'Insurance', color: '#EC4899' },
    { name: 'Other', color: '#6B7280' }
  ];

  constructor(
    private fb: FormBuilder,
    private financialDataService: FinancialDataService,
    private authService: AuthService,
    private firestore: Firestore,
    private router: Router
  ) {
    this.budgetForm = this.fb.group({
    category: ['', Validators.required],
    monthlyLimit: ['', [Validators.required, Validators.min(1)]],
    spent: [0, [Validators.min(0)]], 
    color: ['#4F46E5', Validators.required],
    alertThreshold: [80, [Validators.required, Validators.min(1), Validators.max(100)]]
});
  }

  ngOnInit(): void {
    //this.loadBudgets();
    this.setupBudgetSubscription();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private setupBudgetSubscription(): void {
    this.subscription = this.financialDataService.budgets$.subscribe(budgets => {
      this.budgets = budgets;
      this.isLoading = false;
    });
  }

  private async loadBudgets(): Promise<void> {
    const currentUser = this.authService.currentUser;
    if (!currentUser) return;

    try {
      const userDocRef = doc(this.firestore, 'users', currentUser.uid);
      const budgetsRef = collection(userDocRef, 'budgets');
      const snapshot = await getDocs(budgetsRef);

      this.budgets = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BudgetItem));
      this.isLoading = false;
    } catch (error) {
      console.error('Error loading budgets:', error);
      this.isLoading = false;
    }
  }


  openAddModal(): void {
    this.editingBudget = null;
    this.isModalOpen = true;
    this.budgetForm.reset({
      category: '',
      monthlyLimit: '',
      color: '#4F46E5',
      alertThreshold: 80
    });
  }

 openEditModal(budget: BudgetItem): void {
  this.editingBudget = budget;
  this.isModalOpen = true;
  this.budgetForm.patchValue({
    category: budget.category,
    monthlyLimit: budget.monthlyLimit,
    spent: budget.spent, 
    color: budget.color,
    alertThreshold: budget.alertThreshold
  });
}

  closeModal(): void {
    this.isModalOpen = false;
    this.editingBudget = null;
    this.budgetForm.reset();
  }

  async saveBudget(): Promise<void> {
  if (!this.budgetForm.valid) return;

  const currentUser = this.authService.currentUser;
  if (!currentUser) return;

  try {
    const formValue = this.budgetForm.value;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const userDocRef = doc(this.firestore, 'users', currentUser.uid);

    if (this.editingBudget) {
      const budgetDocRef = doc(userDocRef, 'budgets', this.editingBudget.id);
      await updateDoc(budgetDocRef, {
        category: formValue.category,
        monthlyLimit: parseFloat(formValue.monthlyLimit),
        spent: parseFloat(formValue.spent), 
        color: formValue.color,
        alertThreshold: formValue.alertThreshold
      });
    } else {
      const budgetData = {
        category: formValue.category,
        monthlyLimit: parseFloat(formValue.monthlyLimit),
        spent: 0, 
        month: currentMonth,
        year: currentYear,
        color: formValue.color,
        alertThreshold: formValue.alertThreshold
      };
      const budgetsRef = collection(userDocRef, 'budgets');
      await addDoc(budgetsRef, budgetData);
    }

    this.closeModal();
    await this.loadBudgets();
  } catch (error) {
    console.error('Error saving budget:', error);
    alert('Error saving budget. Please try again.');
  }
}
  async deleteBudget(budget: BudgetItem): Promise<void> {
    if (!confirm(`Are you sure you want to delete the ${budget.category} budget?`)) return;
    const currentUser = this.authService.currentUser;
    if (!currentUser) return;

    try {
      const userDocRef = doc(this.firestore, 'users', currentUser.uid);
      const budgetDocRef = doc(userDocRef, 'budgets', budget.id);
      await deleteDoc(budgetDocRef);
      await this.loadBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
      alert('Error deleting budget. Please try again.');
    }
  }

  async resetBudgetSpending(budget: BudgetItem): Promise<void> {
    if (!confirm(`Reset spending for ${budget.category}?`)) return;
    const currentUser = this.authService.currentUser;
    if (!currentUser) return;

    try {
      const userDocRef = doc(this.firestore, 'users', currentUser.uid);
      const budgetDocRef = doc(userDocRef, 'budgets', budget.id);
      await updateDoc(budgetDocRef, { spent: 0 });
      await this.loadBudgets();
    } catch (error) {
      console.error('Error resetting budget spending:', error);
      alert('Error resetting budget spending. Please try again.');
    }
  }

  
  getAvailableCategories(): typeof this.availableCategories {
    const usedCategories = this.budgets.map(b => b.category);
    return this.availableCategories.filter(cat => !usedCategories.includes(cat.name));
  }

  getBudgetPercentage(spent: number, limit: number): number {
    return Math.min((spent / limit) * 100, 100);
  }

  getBudgetStatus(spent: number, limit: number, alertThreshold: number): string {
    const percentage = this.getBudgetPercentage(spent, limit);
    if (percentage >= 100) return 'over';
    if (percentage >= alertThreshold) return 'warning';
    return 'good';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  getCurrentMonthYear(): string {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  getTotalBudgeted(): number {
    return this.budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  }

  getTotalSpent(): number {
    return this.budgets.reduce((sum, b) => sum + b.spent, 0);
  }

  navigateToTransactions(): void {
    this.router.navigate(['/transactions']);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
