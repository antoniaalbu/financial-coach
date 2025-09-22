import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FinancialDataService } from '../../services/financial-data.service';
import { AuthService } from '../../services/auth.service';
import { Firestore, collection, doc, addDoc, updateDoc, deleteDoc, getDocs } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';

interface TransactionItem {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: Date;
}

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class TransactionsComponent implements OnInit, OnDestroy {
  transactions: TransactionItem[] = [];
  isLoading = true;

  isModalOpen = false;
  editingTransaction: TransactionItem | null = null;

  transactionForm: FormGroup;
  private subscription: Subscription | null = null;

  readonly categories = [
    'Food & Dining', 'Transportation', 'Entertainment', 'Shopping',
    'Bills & Utilities', 'Healthcare', 'Education', 'Travel',
    'Housing', 'Insurance', 'Other'
  ];

  constructor(
    private fb: FormBuilder,
    private financialDataService: FinancialDataService,
    private authService: AuthService,
    private firestore: Firestore,
    private router: Router
  ) {
    this.transactionForm = this.fb.group({
      type: ['expense', Validators.required],
      category: ['', Validators.required],
      description: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      date: [new Date(), Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadTransactions();
    this.subscription = this.financialDataService.transactions$.subscribe(transactions => {
      this.transactions = transactions;
      this.isLoading = false;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private async loadTransactions(): Promise<void> {
  const currentUser = this.authService.currentUser;
  if (!currentUser) return;

  try {
    const userDocRef = doc(this.firestore, 'users', currentUser.uid);
    const transactionsRef = collection(userDocRef, 'transactions');
    const snapshot = await getDocs(transactionsRef);

    this.transactions = snapshot.docs.map(d => {
      const data = d.data() as any;
      return {
        id: d.id,
        type: data.type,
        category: data.category,
        description: data.description,
        amount: data.amount,
        
        date: data.date?.toDate ? data.date.toDate() : new Date(data.date)
      } as TransactionItem;
    });

    this.isLoading = false;
  } catch (error) {
    console.error('Error loading transactions:', error);
    this.isLoading = false;
  }
}


  openAddModal(): void {
  this.editingTransaction = null;
  this.isModalOpen = true;
  this.transactionForm.reset({
    type: 'expense',
    category: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().substring(0, 10) 
  });
}


 openEditModal(transaction: TransactionItem): void {
  this.editingTransaction = transaction;
  this.isModalOpen = true;

  this.transactionForm.patchValue({
    type: transaction.type,
    category: transaction.category,
    description: transaction.description,
    amount: transaction.amount,
    date: transaction.date ? transaction.date.toISOString().substring(0, 10) : ''
  });
}



  closeModal(): void {
    this.isModalOpen = false;
    this.editingTransaction = null;
    this.transactionForm.reset();
  }

async saveTransaction(): Promise<void> {
  if (!this.transactionForm.valid) return;
  const currentUser = this.authService.currentUser;
  if (!currentUser) return;

  const formValue = this.transactionForm.value;
  const userDocRef = doc(this.firestore, 'users', currentUser.uid);
  const transactionsRef = collection(userDocRef, 'transactions');

  try {
    if (this.editingTransaction) {
      const transactionDocRef = doc(transactionsRef, this.editingTransaction.id);
      await updateDoc(transactionDocRef, {
        ...formValue,
        date: formValue.date instanceof Date ? formValue.date : new Date(formValue.date)
      });
    } else {
      await addDoc(transactionsRef, {
        ...formValue,
        date: formValue.date instanceof Date ? formValue.date : new Date(formValue.date)
      });

      // ✅ Update the related budget if it's an expense
      if (formValue.type === 'expense') {
        await this.financialDataService.updateBudgetSpending(
          formValue.category,
          formValue.amount
        );
      }
    }

    this.closeModal();
    await this.loadTransactions();
  } catch (error) {
    console.error('Error saving transaction:', error);
    alert('Error saving transaction. Please try again.');
  }
}

  async deleteTransaction(transaction: TransactionItem): Promise<void> {
    if (!confirm(`Delete this ${transaction.type} transaction?`)) return;
    const currentUser = this.authService.currentUser;
    if (!currentUser) return;

    try {
      const userDocRef = doc(this.firestore, 'users', currentUser.uid);
      const transactionDocRef = doc(userDocRef, 'transactions', transaction.id);
      await deleteDoc(transactionDocRef);
      await this.loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Error deleting transaction. Please try again.');
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }
}
