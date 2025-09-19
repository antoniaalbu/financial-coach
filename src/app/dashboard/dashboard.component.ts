import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: Date;
  icon: string;
}

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  deadline: Date;
  color: string;
  icon: string;
}

interface Investment {
  id: string;
  name: string;
  symbol: string;
  amount: number;
  currentValue: number;
  change: number;
  changePercent: number;
  icon: string;
}

interface BudgetCategory {
  id: string;
  name: string;
  spent: number;
  budget: number;
  color: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [CommonModule]
})
export class DashboardComponent implements OnInit {
  
 
  userName = 'Me';
  userAvatar = 'https://media.licdn.com/dms/image/v2/D4E03AQH1fDAyoxvo0g/profile-displayphoto-shrink_800_800/B4EZTDgIK5GwAc-/0/1738446767854?e=1761177600&v=beta&t=ZKKwpuhrmNf-kMI8toLIdJm6EgLG6f2kNqphEe2n-xk';

  totalBalance = 45750.80;
  monthlyIncome = 8500.00;
  monthlyExpenses = 3250.75;
  monthlyChange = 15.4;
  
  recentTransactions: Transaction[] = [
    {
      id: '1',
      type: 'income',
      category: 'Salary',
      description: 'Monthly Salary',
      amount: 8500,
      date: new Date('2024-09-15'),
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>`
    },
    {
      id: '2',
      type: 'expense',
      category: 'Food',
      description: 'Grocery Shopping',
      amount: 156.80,
      date: new Date('2024-09-14'),
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6.28"/>`
    },
    {
      id: '3',
      type: 'expense',
      category: 'Transportation',
      description: 'Gas Station',
      amount: 67.50,
      date: new Date('2024-09-13'),
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>`
    },
    {
      id: '4',
      type: 'income',
      category: 'Investment',
      description: 'Dividend Payment',
      amount: 240.30,
      date: new Date('2024-09-12'),
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>`
    },
    {
      id: '5',
      type: 'expense',
      category: 'Entertainment',
      description: 'Netflix Subscription',
      amount: 15.99,
      date: new Date('2024-09-11'),
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a1.5 1.5 0 110 3H9"/>`
    }
  ];
  

  goals: Goal[] = [
    {
      id: '1',
      title: 'Emergency Fund',
      target: 25000,
      current: 18750,
      deadline: new Date('2024-12-31'),
      color: '#4F46E5',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>`
    },
    {
      id: '2',
      title: 'Vacation Fund',
      target: 8000,
      current: 3200,
      deadline: new Date('2025-06-30'),
      color: '#06B6D4',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/>`
    },
    {
      id: '3',
      title: 'House Down Payment',
      target: 60000,
      current: 22500,
      deadline: new Date('2026-03-01'),
      color: '#8B5CF6',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>`
    }
  ];
  
 
  investments: Investment[] = [
    {
      id: '1',
      name: 'Apple Inc.',
      symbol: 'AAPL',
      amount: 5000,
      currentValue: 5750,
      change: 750,
      changePercent: 15.0,
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>`
    },
    {
      id: '2',
      name: 'Tesla Inc.',
      symbol: 'TSLA',
      amount: 3000,
      currentValue: 2850,
      change: -150,
      changePercent: -5.0,
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/>`
    },
    {
      id: '3',
      name: 'S&P 500 ETF',
      symbol: 'SPY',
      amount: 7500,
      currentValue: 8100,
      change: 600,
      changePercent: 8.0,
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>`
    }
  ];
  
 
  budgetCategories: BudgetCategory[] = [
    {
      id: '1',
      name: 'Food & Dining',
      spent: 680,
      budget: 800,
      color: '#4F46E5',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6.28"/>`
    },
    {
      id: '2',
      name: 'Transportation',
      spent: 320,
      budget: 400,
      color: '#06B6D4',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>`
    },
    {
      id: '3',
      name: 'Entertainment',
      spent: 180,
      budget: 300,
      color: '#8B5CF6',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a1.5 1.5 0 110 3H9"/>`
    },
    {
      id: '4',
      name: 'Shopping',
      spent: 450,
      budget: 600,
      color: '#F59E0B',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>`
    }
  ];

   constructor(
    private router: Router,
    private authService: AuthService,
    private firestore: Firestore,
    private cdr: ChangeDetectorRef
  ) {}

  
  async ngOnInit(): Promise<void> {
    const currentUser = this.authService.currentUser;

    if (currentUser?.email) {
      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, where('email', '==', currentUser.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const data: any = querySnapshot.docs[0].data();
        const firstName = data.firstName || '';
        const lastName = data.lastName || '';
        this.userName = `${firstName} ${lastName}`.trim() || 'User';

        if (data.avatarUrl) {
          this.userAvatar = data.avatarUrl;
        }
      } else {
        this.userName = 'User';
      }

      // Force Angular to detect changes since this is async
      this.cdr.markForCheck();
    }
  }


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

  addTransaction(): void {
    console.log('Add transaction clicked');
  }

  addGoal(): void {
    console.log('Add goal clicked');
  }

  logout(): void {
    this.router.navigate(['/login']);
  }
}