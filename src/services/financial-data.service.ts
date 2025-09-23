import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  Timestamp
} from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Transaction, Goal, Budget, Investment } from '../models/financial.model';    

@Injectable({
  providedIn: 'root'
})
export class FinancialDataService {
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  private goalsSubject = new BehaviorSubject<Goal[]>([]);
  private budgetsSubject = new BehaviorSubject<Budget[]>([]);
  private investmentsSubject = new BehaviorSubject<Investment[]>([]);

  public transactions$ = this.transactionsSubject.asObservable();
  public goals$ = this.goalsSubject.asObservable();
  public budgets$ = this.budgetsSubject.asObservable();
  public investments$ = this.investmentsSubject.asObservable();

  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) {
    this.initializeRealtimeListeners();
  }

  private initializeRealtimeListeners() {
    const currentUser = this.authService.currentUser;
    if (!currentUser) return;

    // Transactions listener
    const transactionsRef = collection(this.firestore, 'transactions');
    const transactionsQuery = query(
      transactionsRef,
      where('userId', '==', currentUser.uid),
      orderBy('date', 'desc'),
      limit(100)
    );

    onSnapshot(transactionsQuery, (snapshot) => {
      const transactions: Transaction[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          ...data,
          date: data['date']?.toDate(),
          createdAt: data['createdAt']?.toDate()
        } as Transaction);
      });
      this.transactionsSubject.next(transactions);
    });

    // Goals listener
    const goalsRef = collection(this.firestore, 'goals');
    const goalsQuery = query(
      goalsRef,
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    onSnapshot(goalsQuery, (snapshot) => {
      const goals: Goal[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        goals.push({
          id: doc.id,
          ...data,
          deadline: data['deadline']?.toDate(),
          createdAt: data['createdAt']?.toDate()
        } as Goal);
      });
      this.goalsSubject.next(goals);
    });

    // Budgets listener
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const userDocRef = doc(this.firestore, 'users', currentUser.uid);
    const budgetsRef = collection(userDocRef, 'budgets');
    const budgetsQuery = query(
      budgetsRef,
      where('month', '==', currentMonth),
      where('year', '==', currentYear)
    );

    onSnapshot(budgetsQuery, (snapshot) => {
      const budgets: Budget[] = [];
      snapshot.forEach((doc) => {
        budgets.push({
          id: doc.id,
          ...doc.data()
        } as Budget);
      });
      this.budgetsSubject.next(budgets);
    });
  }

  // Transaction methods
  async addTransaction(transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt'>): Promise<string> {
    const currentUser = this.authService.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    const transactionData = {
      ...transaction,
      userId: currentUser.uid,
      createdAt: Timestamp.now(),
      date: Timestamp.fromDate(transaction.date)
    };

    const docRef = await addDoc(collection(this.firestore, 'transactions'), transactionData);

    if (transaction.type === 'expense') {
      await this.updateBudgetSpending(transaction.category, transaction.amount);
    }

    return docRef.id;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    const transactionRef = doc(this.firestore, 'transactions', id);
    const updateData = {
      ...updates,
      ...(updates.date && { date: Timestamp.fromDate(updates.date) })
    };
    await updateDoc(transactionRef, updateData);
  }

  async deleteTransaction(id: string): Promise<void> {
    const transactionRef = doc(this.firestore, 'transactions', id);
    await deleteDoc(transactionRef);
  }

  // Goal methods
  async addGoal(goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'isCompleted'>): Promise<string> {
    const currentUser = this.authService.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    const goalData = {
      ...goal,
      userId: currentUser.uid,
      createdAt: Timestamp.now(),
      deadline: Timestamp.fromDate(goal.deadline),
      isCompleted: false
    };

    const docRef = await addDoc(collection(this.firestore, 'goals'), goalData);
    return docRef.id;
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<void> {
    const goalRef = doc(this.firestore, 'goals', id);
    const updateData = {
      ...updates,
      ...(updates.deadline && { deadline: Timestamp.fromDate(updates.deadline) })
    };
    await updateDoc(goalRef, updateData);
  }

  async updateGoalProgress(id: string, amount: number): Promise<void> {
    const goalRef = doc(this.firestore, 'goals', id);
    await updateDoc(goalRef, { current: amount });
  }

  // Budget methods
  async createMonthlyBudgets(budgets: Array<{category: string, monthlyLimit: number, color: string}>, userId: string): Promise<void> {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const userDocRef = doc(this.firestore, 'users', userId);
    const budgetsCollectionRef = collection(userDocRef, 'budgets');

    const promises = budgets.map(budget => {
      const budgetData = {
        ...budget,
        spent: 0,
        month: currentMonth,
        year: currentYear,
        alertThreshold: 80
      };
      return addDoc(budgetsCollectionRef, budgetData);
    });

    await Promise.all(promises);
  }

  private async updateBudgetSpending(category: string, amount: number): Promise<void> {
    const currentUser = this.authService.currentUser;
    if (!currentUser) return;

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const userDocRef = doc(this.firestore, 'users', currentUser.uid);
    const budgetsRef = collection(userDocRef, 'budgets');
    const budgetQuery = query(
      budgetsRef,
      where('category', '==', category),
      where('month', '==', currentMonth),
      where('year', '==', currentYear)
    );

    const querySnapshot = await getDocs(budgetQuery);
    if (!querySnapshot.empty) {
      const budgetDoc = querySnapshot.docs[0];
      const currentSpent = budgetDoc.data()['spent'] || 0;
      await updateDoc(budgetDoc.ref, { spent: currentSpent + amount });
    }
  }

  // Analytics methods
  getMonthlyIncome(): Observable<number> {
    return this.transactions$.pipe(
      map(transactions => {
        const now = new Date();
        return transactions
          .filter(t => t.type === 'income' && t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear())
          .reduce((sum, t) => sum + t.amount, 0);
      })
    );
  }

  getMonthlyExpenses(): Observable<number> {
    return this.transactions$.pipe(
      map(transactions => {
        const now = new Date();
        return transactions
          .filter(t => t.type === 'expense' && t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear())
          .reduce((sum, t) => sum + t.amount, 0);
      })
    );
  }

  getTotalBalance(): Observable<number> {
    return this.transactions$.pipe(
      map(transactions => transactions.reduce((balance, t) => t.type === 'income' ? balance + t.amount : balance - t.amount, 0))
    );
  }

  getExpensesByCategory(): Observable<{[category: string]: number}> {
    return this.transactions$.pipe(
      map(transactions => {
        const now = new Date();
        const expenses = transactions.filter(t => t.type === 'expense' && t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear());
        return expenses.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {} as {[category: string]: number});
      })
    );
  }

  getMonthlyTrends(months: number = 6): Observable<{month: string, income: number, expenses: number}[]> {
    return this.transactions$.pipe(
      map(transactions => {
        const trends = [];
        const now = new Date();
        for (let i = months - 1; i >= 0; i--) {
          const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthTransactions = transactions.filter(t => t.date.getMonth() === targetDate.getMonth() && t.date.getFullYear() === targetDate.getFullYear());
          const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
          const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
          trends.push({ month: targetDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), income, expenses });
        }
        return trends;
      })
    );
  }

  async checkIfBudgetsExist(userId: string): Promise<boolean> {
    const userDocRef = doc(this.firestore, 'users', userId);
    const budgetsRef = collection(userDocRef, 'budgets');
    const snapshot = await getDocs(budgetsRef);
    return !snapshot.empty;
  }
}
