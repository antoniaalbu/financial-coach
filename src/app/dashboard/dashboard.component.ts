import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FinancialDataService } from '../../services/financial-data.service';
import { Firestore, collection, query, where, getDocs, doc, getDoc } from '@angular/fire/firestore';
import { Observable, combineLatest, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

// Import Chart.js
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

interface DashboardData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyChange: number;
  transactions: any[];
  goals: any[];
  budgets: any[];
  expensesByCategory: {[category: string]: number};
  monthlyTrends: {month: string, income: number, expenses: number}[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [CommonModule]
})
export class DashboardComponent implements OnInit, OnDestroy {
  userName = '';
  userAvatar = 'https://media.licdn.com/dms/image/v2/D4E03AQH1fDAyoxvo0g/profile-displayphoto-shrink_800_800/B4EZTDgIK5GwAc-/0/1738446767854?e=1761177600&v=beta&t=ZKKwpuhrmNf-kMI8toLIdJm6EgLG6f2kNqphEe2n-xk';
  isLoading = true;
  
  // Dashboard data
  dashboardData: DashboardData = {
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyChange: 0,
    transactions: [],
    goals: [],
    budgets: [],
    expensesByCategory: {},
    monthlyTrends: []
  };

  // Chart references
  private pieChart: Chart | null = null;
  private lineChart: Chart | null = null;
  
  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private financialDataService: FinancialDataService,
    private firestore: Firestore,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadUserProfile();
    this.setupDataSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
      this.fetchBudgets();
    this.destroyCharts();
  }

  private async fetchBudgets(): Promise<void> {
  const currentUser = this.authService.currentUser;
  if (!currentUser) return;

  try {
    const budgetsRef = collection(this.firestore, `users/${currentUser.uid}/budgets`);
    const snapshot = await getDocs(budgetsRef);

    if (snapshot.empty) {
      console.log('No budgets found for user', currentUser.uid);
      this.dashboardData.budgets = [];
      return;
    }

    const budgets: any[] = [];
    snapshot.forEach(doc => {
      budgets.push({ id: doc.id, ...doc.data() });
    });

    console.log('Budgets fetched from Firestore:', budgets);

    // Update dashboard data
    this.dashboardData.budgets = budgets;
    this.cdr.detectChanges();
  } catch (error) {
    console.error('Error fetching budgets:', error);
  }
}


  private async loadUserProfile(): Promise<void> {
    try {
      const currentUser = this.authService.currentUser;
      if (!currentUser) {
        console.log('No authenticated user found');
        this.userName = 'Guest';
        return;
      }

      console.log('Loading profile for user:', currentUser.uid);

      // Try to get user document by UID first (recommended approach)
      const userDocRef = doc(this.firestore, 'users', currentUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log('User data from UID:', userData);
        
        const firstName = userData['firstName'] || '';
        const lastName = userData['lastName'] || '';

        this.userName = `${firstName} ${lastName}`.trim();
        if (!this.userName) {
          this.userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
        }

        if (userData['avatarUrl']) {
          this.userAvatar = userData['avatarUrl'];
        }
      } else {
        // Fallback: try to find user by email
        console.log('User document not found by UID, trying email lookup');
        
        if (currentUser.email) {
          const usersRef = collection(this.firestore, 'users');
          const emailQuery = query(usersRef, where('email', '==', currentUser.email));
          const querySnapshot = await getDocs(emailQuery);

          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            console.log('User data from email:', userData);
            
            const firstName = userData['firstName'] || '';
            const lastName = userData['lastName'] || '';

            this.userName = `${firstName} ${lastName}`.trim();
            if (!this.userName) {
              this.userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
            }

            if (userData['avatarUrl']) {
              this.userAvatar = userData['avatarUrl'];
            }
          } else {
            console.log('No user document found by email either');
            this.userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
          }
        } else {
          this.userName = currentUser.displayName || 'User';
        }
      }

      console.log('Final username set to:', this.userName);
    } catch (error) {
      console.error('Error loading user data:', error);
      const currentUser = this.authService.currentUser;
      this.userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
    }
  }

  private setupDataSubscriptions(): void {
    // Check if user is authenticated before setting up subscriptions
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      console.log('No authenticated user, skipping data subscriptions');
      this.isLoading = false;
      return;
    }

    console.log('Setting up data subscriptions for user:', currentUser.uid);

    // Combine all financial data streams
    const dashboardData$ = combineLatest([
      this.financialDataService.getTotalBalance(),
      this.financialDataService.getMonthlyIncome(),
      this.financialDataService.getMonthlyExpenses(),
      this.financialDataService.transactions$,
      this.financialDataService.goals$,
      this.financialDataService.budgets$,
      this.financialDataService.getExpensesByCategory(),
      this.financialDataService.getMonthlyTrends()
    ]).pipe(
      map(([balance, income, expenses, transactions, goals, budgets, expensesByCategory, monthlyTrends]) => {
        // Calculate monthly change percentage
        const previousMonthExpenses = this.getPreviousMonthExpenses(transactions);
        const monthlyChange = previousMonthExpenses > 0 
          ? ((expenses - previousMonthExpenses) / previousMonthExpenses) * 100
          : 0;

        return {
          totalBalance: balance,
          monthlyIncome: income,
          monthlyExpenses: expenses,
          monthlyChange,
          transactions: transactions.slice(0, 5), // Latest 5 transactions
          goals: goals.filter(g => !g.isCompleted).slice(0, 3), // Top 3 active goals
          budgets,
          expensesByCategory,
          monthlyTrends
        };
      })
    );

    const subscription = dashboardData$.subscribe({
      next: (data) => {
        console.log('Dashboard data updated:', data);
        this.dashboardData = data;
        this.isLoading = false;
        this.cdr.detectChanges();
        
        // Update charts after data is loaded
        setTimeout(() => {
          this.createPieChart();
          this.createLineChart();
        }, 100);
      },
      error: (error) => {
        console.error('Error in dashboard data subscription:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });

    this.subscriptions.push(subscription);
  }

  private getPreviousMonthExpenses(transactions: any[]): number {
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    
    return transactions
      .filter(t => 
        t.type === 'expense' && 
        t.date.getMonth() === previousMonth.getMonth() && 
        t.date.getFullYear() === previousMonth.getFullYear()
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private createPieChart(): void {
    const canvas = document.getElementById('expensesPieChart') as HTMLCanvasElement;
    if (!canvas) return;

    this.destroyPieChart();

    const categories = Object.keys(this.dashboardData.expensesByCategory);
    const amounts = Object.values(this.dashboardData.expensesByCategory);

    if (categories.length === 0) return;

    const colors = [
      '#4F46E5', '#06B6D4', '#8B5CF6', '#F59E0B', 
      '#EF4444', '#10B981', '#F97316', '#84CC16'
    ];

    const config: ChartConfiguration = {
      type: 'pie' as ChartType,
      data: {
        labels: categories,
        datasets: [{
          data: amounts,
          backgroundColor: colors.slice(0, categories.length),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = this.formatCurrency(context.raw as number);
                const total = amounts.reduce((sum, amount) => sum + amount, 0);
                const percentage = ((context.raw as number / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.pieChart = new Chart(canvas, config);
  }

  private createLineChart(): void {
    const canvas = document.getElementById('trendsLineChart') as HTMLCanvasElement;
    if (!canvas) return;

    this.destroyLineChart();

    const trends = this.dashboardData.monthlyTrends;
    if (trends.length === 0) return;

    const config: ChartConfiguration = {
      type: 'line' as ChartType,
      data: {
        labels: trends.map(t => t.month),
        datasets: [
          {
            label: 'Income',
            data: trends.map(t => t.income),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Expenses',
            data: trends.map(t => t.expenses),
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = this.formatCurrency(context.raw as number);
                return `${label}: ${value}`;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Month'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Amount'
            },
            ticks: {
              callback: (value) => this.formatCurrency(value as number)
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    };

    this.lineChart = new Chart(canvas, config);
  }

  private destroyCharts(): void {
    this.destroyPieChart();
    this.destroyLineChart();
  }

  private destroyPieChart(): void {
    if (this.pieChart) {
      this.pieChart.destroy();
      this.pieChart = null;
    }
  }

  private destroyLineChart(): void {
    if (this.lineChart) {
      this.lineChart.destroy();
      this.lineChart = null;
    }
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  getProgressPercentage(current: number, target: number): number {
    return Math.min((current / target) * 100, 100);
  }

  getBudgetPercentage(spent: number, budget: number): number {
    return Math.min((spent / budget) * 100, 100);
  }

  getDisplayName(): string {
    if (this.isLoading) {
      return 'Loading...';
    }
    return this.userName || 'User';
  }

  // Helper method to get current month label
  getCurrentMonthLabel(): string {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // Helper method to calculate savings rate
  getSavingsRate(): string {
    if (this.dashboardData.monthlyIncome === 0) return '0.0';
    const rate = ((this.dashboardData.monthlyIncome - this.dashboardData.monthlyExpenses) / this.dashboardData.monthlyIncome * 100);
    return rate.toFixed(1);
  }

  // Helper method to get budget icon based on category
  getBudgetIcon(category: string): string {
    const iconMap: {[key: string]: string} = {
      'Food & Dining': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6.28"/>',
      'Transportation': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>',
      'Entertainment': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a1.5 1.5 0 110 3H9"/>',
      'Shopping': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>',
      'Bills & Utilities': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>',
      'Healthcare': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>',
      'Education': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>',
      'Travel': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/>',
      'Housing': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>',
      'Insurance': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>',
      'Other': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"/>'
    };
    
    return iconMap[category] || iconMap['Other'];
  }

  // Helper method to get goal icon based on category
  getGoalIcon(category: string): string {
    const iconMap: {[key: string]: string} = {
      'emergency': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>',
      'vacation': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/>',
      'house': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>',
      'car': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>',
      'investment': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>',
      'other': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>'
    };
    
    return iconMap[category] || iconMap['other'];
  }

  // Navigation methods
  navigateToTransactions(): void {
    this.router.navigate(['/transactions']);
  }

  navigateToGoals(): void {
    this.router.navigate(['/goals']);
  }

  navigateToInvestments(): void {
    this.router.navigate(['/investments']);
  }

  navigateToBudget(): void {
    this.router.navigate(['/budget']);
  }

  navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }

  // Quick action methods
  addTransaction(): void {
    this.router.navigate(['/transactions/add']);
  }

  addGoal(): void {
    this.router.navigate(['/goals/create']);
  }

  async quickAddIncome(): Promise<void> {
    this.router.navigate(['/transactions/add'], { queryParams: { type: 'income' } });
  }

  async quickAddExpense(): Promise<void> {
    this.router.navigate(['/transactions/add'], { queryParams: { type: 'expense' } });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}