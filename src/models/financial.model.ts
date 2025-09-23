export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  createdAt: Date;
  monthlyIncome?: number;
  currency: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  date: Date;
  createdAt: Date;
  tags?: string[];
  recurring?: boolean;
  recurringFrequency?: 'weekly' | 'monthly' | 'yearly';
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  target: number;
  current: number;
  deadline: Date;
  createdAt: Date;
  color: string;
  category: 'emergency' | 'vacation' | 'house' | 'car' | 'investment' | 'other';
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  monthlyLimit: number;
  spent: number;
  month: number;
  year: number;
  color: string;
  alertThreshold: number; // percentage (0-100)
}

export interface Investment {
  id: string;
  userId: string;
  name: string;
  symbol: string;
  type: 'stock' | 'etf' | 'crypto' | 'bond' | 'mutual_fund';
  amount: number; // invested amount
  currentValue: number;
  shares?: number;
  purchaseDate: Date;
  lastUpdated: Date;
}
