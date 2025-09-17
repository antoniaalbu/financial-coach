import { CommonModule } from '@angular/common';
import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  linkedin?: string;
  twitter?: string;
  expertise: string[];
  quote: string;
}

interface Milestone {
  year: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface Value {
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface Achievement {
  number: string;
  label: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-about',
  templateUrl: './about-page.component.html',
  styleUrls: ['./about-page.component.css'],
  imports: [CommonModule, FormsModule]
})
export class AboutComponent implements OnInit, AfterViewInit {
  @ViewChild('heroSection', { static: false }) heroSection!: ElementRef;

  scrollY = 0;
  activeSection = 'story';

  teamMembers: TeamMember[] = [
      {
      id: 'antonia-albu',
      name: 'Albu Antonia Gabriela',
      role: 'Computer Science Student & Front-End Developer',
      bio: 'Final-year student at the Technical University of Cluj-Napoca, specializing in Information Technology. Currently part of the NTT DATA TechTrek program, where I build web applications using JavaScript, TypeScript, and Angular. Passionate about front-end development, user experience, and bringing ideas to life through code.',
      avatar: 'https://media.licdn.com/dms/image/v2/D4E03AQH1fDAyoxvo0g/profile-displayphoto-shrink_800_800/B4EZTDgIK5GwAc-/0/1738446767854?e=1761177600&v=beta&t=ZKKwpuhrmNf-kMI8toLIdJm6EgLG6f2kNqphEe2n-xk',
      linkedin: 'https://www.linkedin.com/in/antonia-albu-50a30734a/',
      expertise: ['Front-End Development', 'Web Applications', 'Angular & React', 'JavaScript & TypeScript'],
      quote: 'I love building clean, functional web applications that solve real problems and provide a great user experience.'
    }
    
  ];

  milestones: Milestone[] = [
    {
      year: '2020',
      title: 'The Idea',
      description: 'Founded with a vision to make smart financial management accessible to everyone, not just the wealthy.',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      color: '#4F46E5'
    },
    {
      year: '2021',
      title: 'First Product',
      description: 'Launched our MVP with basic budgeting and expense tracking, serving 1,000 beta users.',
      icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
      color: '#06B6D4'
    },
    {
      year: '2022',
      title: 'AI Integration',
      description: 'Introduced AI-powered insights and personalized recommendations, growing to 50,000 users.',
      icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
      color: '#8B5CF6'
    },
    {
      year: '2023',
      title: 'Series A',
      description: 'Raised $15M Series A to expand our team and enhance our AI capabilities.',
      icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
      color: '#10B981'
    },
    {
      year: '2024',
      title: 'Community Launch',
      description: 'Built a thriving community of 500,000+ users sharing financial knowledge and success stories.',
      icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
      color: '#F59E0B'
    },
    {
      year: '2025',
      title: 'Global Expansion',
      description: 'Expanding internationally while continuing to innovate with advanced AI and machine learning.',
      icon: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
      color: '#EF4444'
    }
  ];

  values: Value[] = [
    {
      title: 'Accessibility First',
      description: 'Financial tools should be available to everyone, regardless of their income level or financial knowledge.',
      icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
      color: '#4F46E5'
    },
    {
      title: 'Transparency',
      description: 'No hidden fees, no complex jargon. We believe in clear, honest communication about money.',
      icon: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z',
      color: '#06B6D4'
    },
    {
      title: 'Continuous Learning',
      description: 'We\'re always improving, always learning from our users to build better financial tools.',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      color: '#8B5CF6'
    }
  ];

  achievements: Achievement[] = [
    {
      number: '500K+',
      label: 'Active Users',
      description: 'Trusted by half a million users worldwide',
      icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'
    },
    {
      number: '$50M+',
      label: 'Money Saved',
      description: 'Total amount our users have saved using our platform',
      icon: 'M12 2v20M2 12h20'
    },
    {
      number: '4.9★',
      label: 'App Rating',
      description: 'Average rating across all app stores',
      icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
    },
    {
      number: '99.9%',
      label: 'Uptime',
      description: 'Reliable service you can count on',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  ];

  constructor(private router: Router) { }

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
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  const elements = document.querySelectorAll(
    '.team-card, .milestone-item, .value-card, .achievement-card, .timeline-section'
  );

  elements.forEach(el => observer.observe(el));
}


  navigateToSignup(): void {
   this.router.navigate(['/signup']);
  }

  

  openSocial(platform: string, username: string): void {
    const urls = {
      linkedin: `https://linkedin.com/in/${'antonia-albu'}`,
     
    };
    
    if (urls[platform as keyof typeof urls]) {
      window.open(urls[platform as keyof typeof urls], '_blank');
    }
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }
}