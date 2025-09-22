import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent],
  template: `
    <div class="app-container">
      <app-navbar *ngIf="showNavbar()"></app-navbar>

      <app-sidebar 
        *ngIf="showSidebar()" 
        (sidebarStateChange)="onSidebarStateChange($event)">
      </app-sidebar>

      <div class="content" 
           [class.with-sidebar]="showSidebar()"
           [class.sidebar-collapsed]="sidebarState.isCollapsed">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0a0a0f 0%, #4b4b9e 50%, #5f5d90 100%);
      color: white;
      overflow-x: hidden;
      display: flex;
    }

    .content {
      flex: 1;
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .content.with-sidebar {
      margin-left: 250px; 
    }

    .content.with-sidebar.sidebar-collapsed {
      margin-left: 80px; 
    }

    @media (max-width: 768px) {
      .content.with-sidebar {
        margin-left: 0;
      }
      
      .content.with-sidebar.sidebar-collapsed {
        margin-left: 0;
      }
    }
  `]
})
export class AppComponent {
  sidebarState = { isCollapsed: false, isMobile: false };

  constructor(private router: Router) {}

  showNavbar(): boolean {
    const url = this.router.url;
    return !url.includes('/login') &&
           !url.includes('/signup') &&
           !url.includes('/dashboard') &&
           !url.includes('/budgets');
  }

  showSidebar(): boolean {
    return this.router.url.includes('/dashboard') || this.router.url.includes('/budgets');
  }

  onSidebarStateChange(state: {isCollapsed: boolean, isMobile: boolean}) {
    this.sidebarState = state;
  }
}