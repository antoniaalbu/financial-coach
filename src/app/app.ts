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
      <!-- Show Navbar if not login/signup/dashboard -->
      <app-navbar *ngIf="showNavbar()"></app-navbar>

      <!-- Show Sidebar if on dashboard -->
      <app-sidebar *ngIf="showSidebar()"></app-sidebar>

      <!-- Main content -->
      <div class="content" [class.with-sidebar]="showSidebar()">
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
      transition: margin-left 0.3s ease;
    }

    .content.with-sidebar {
      margin-left: 250px; /* same as sidebar width */
    }
  `]
})
export class AppComponent {
  constructor(private router: Router) {}

  showNavbar(): boolean {
    const url = this.router.url;
    return !url.includes('/login') &&
           !url.includes('/signup') &&
           !url.includes('/dashboard');
  }

  showSidebar(): boolean {
    return this.router.url.includes('/dashboard');
  }
}
