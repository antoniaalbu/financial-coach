import { CommonModule } from '@angular/common';
import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  details: string[];
  benefits: string[];
  color: string;
}

interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  quote: string;
  rating: number;
}

@Component({
  selector: 'app-features',
  templateUrl: './features-page.component.html',
  styleUrls: ['./features-page.component.css'],
  imports: [CommonModule]
})
export class FeaturesComponent implements OnInit, AfterViewInit {
  @ViewChild('heroSection', { static: false }) heroSection!: ElementRef;

  scrollY = 0;
  activeFeature = 'ai-insights';
  
  features: Feature[] = [
    {
      id: 'ai-insights',
      icon: `<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>`,
      title: 'AI-Powered Insights',
      description: 'Advanced machine learning algorithms analyze your spending patterns to provide personalized financial recommendations.',
      details: [
        'Real-time spending analysis and categorization',
        'Predictive modeling for future expenses',
        'Personalized saving opportunities identification',
        'Smart investment recommendations based on risk profile'
      ],
      benefits: [
        'Save up to 30% more each month',
        'Reduce unnecessary expenses by 25%',
        'Get insights 10x faster than manual analysis'
      ],
      color: '#4F46E5'
    },
    {
      id: 'smart-analytics',
      icon: `<path d="M3 3v18h18"/><path d="M7 12l4-4 4 4 5-5"/>`,
      title: 'Smart Analytics Dashboard',
      description: 'Beautiful, intuitive charts and visualizations that make understanding your finances effortless.',
      details: [
        'Interactive spending breakdowns by category',
        'Monthly and yearly trend analysis',
        'Income vs. expense comparisons',
        'Investment performance tracking'
      ],
      benefits: [
        'Understand your finances at a glance',
        'Identify trends and patterns instantly',
        'Make data-driven financial decisions'
      ],
      color: '#06B6D4'
    },
    {
      id: 'goal-tracking',
      icon: `<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>`,
      title: 'Intelligent Goal Tracking',
      description: 'Set ambitious financial goals and let our AI help you achieve them with smart milestones and reminders.',
      details: [
        'Multiple goal types: savings, debt payoff, investment',
        'Automated progress tracking and updates',
        'Smart milestone creation and celebration',
        'Adaptive timeline adjustments based on performance'
      ],
      benefits: [
        'Achieve goals 40% faster on average',
        'Stay motivated with progress celebrations',
        'Get back on track with smart adjustments'
      ],
      color: '#8B5CF6'
    },
    {
      id: 'budget-management',
      icon: `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>`,
      title: 'Smart Budget Management',
      description: 'Dynamic budgeting that learns from your habits and automatically adjusts to help you save more.',
      details: [
        'Automatic transaction categorization',
        'Flexible budget categories that adapt to your lifestyle',
        'Real-time spending alerts and notifications',
        'Surplus fund allocation recommendations'
      ],
      benefits: [
        'Reduce overspending by 60%',
        'Save time with automatic categorization',
        'Never miss a budget target again'
      ],
      color: '#10B981'
    },
    {
      id: 'security',
      icon: `<path d="M9 12l2 2 4-4"/><path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/><path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>`,
      title: 'Bank-Level Security',
      description: 'Enterprise-grade security with end-to-end encryption to keep your financial data completely safe.',
      details: [
        '256-bit SSL encryption for all data transmission',
        'Multi-factor authentication and biometric login',
        'Regular security audits and compliance checks',
        'Zero-knowledge architecture - we never see your data'
      ],
      benefits: [
        'Complete peace of mind',
        '99.9% uptime guarantee',
        'GDPR and SOC2 compliant'
      ],
      color: '#EF4444'
    },
    {
      id: 'community',
      icon: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
      title: 'Vibrant Community',
      description: 'Connect with like-minded investors, share strategies, and learn from collective wisdom.',
      details: [
        'Discussion forums organized by financial topics',
        'Expert-led webinars and Q&A sessions',
        'Peer-to-peer mentoring programs',
        'Success story sharing and inspiration'
      ],
      benefits: [
        'Learn from experienced investors',
        'Get support during financial challenges',
        'Discover new investment strategies'
      ],
      color: '#F59E0B'
    }
  ];

  testimonials: Testimonial[] = [
    {
      name: 'Sarah Chen',
      role: 'Marketing Director',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b287?w=150&h=150&fit=crop&crop=face',
      quote: 'The AI insights helped me save $2,400 in my first year. I finally understand where my money goes!',
      rating: 5
    },
    {
      name: 'Michael Rodriguez',
      role: 'Software Engineer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      quote: 'The goal tracking feature kept me motivated to pay off my student loans 2 years early.',
      rating: 5
    },
    {
      name: 'Emily Johnson',
      role: 'Small Business Owner',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      quote: 'Smart analytics gave me insights I never had before. My business finances are finally organized.',
      rating: 5
    }
  ];

  stats = [
    { number: '50K+', label: 'Active Users' },
    { number: '$2.1M+', label: 'Money Saved' },
    { number: '95%', label: 'Goal Success Rate' },
    { number: '4.9★', label: 'User Rating' }
  ];

  constructor() { }

  ngOnInit(): void {
    this.setupScrollListener();
  }

  ngAfterViewInit(): void {
    this.observeElements();
  }

  private setupScrollListener(): void {
    window.addEventListener('scroll', () => {
      this.scrollY = window.pageYOffset;
    });
  }

  private observeElements(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    
    const elements = document.querySelectorAll('.feature-showcase, .stat-item, .testimonial-card');
    elements.forEach(el => observer.observe(el));
  }

  selectFeature(featureId: string): void {
    this.activeFeature = featureId;
  }

  getActiveFeature(): Feature {
    return this.features.find(f => f.id === this.activeFeature) || this.features[0];
  }

  navigateToSignup(): void {
    console.log('Navigate to signup');
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  generateStars(rating: number): number[] {
    return Array(rating).fill(0);
  }
}