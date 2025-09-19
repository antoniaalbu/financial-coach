import { CommonModule } from '@angular/common';
import { Component, OnInit, HostListener, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  imports: [CommonModule]
})
export class SidebarComponent implements OnInit {
  isCollapsed = false;
  isMobileOpen = false;
  isMobile = false;

  @Output() sidebarStateChange = new EventEmitter<{isCollapsed: boolean, isMobile: boolean}>();

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.emitSidebarState();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
    this.emitSidebarState();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.isMobileOpen = false;
    }
  }

  private emitSidebarState(): void {
    this.sidebarStateChange.emit({
      isCollapsed: this.isCollapsed,
      isMobile: this.isMobile
    });
  }

  expandSidebar(): void {
    if (!this.isMobile) {
      this.isCollapsed = false;
      this.emitSidebarState();
    }
  }

  collapseSidebar(): void {
    if (!this.isMobile) {
      this.isCollapsed = true;
      this.emitSidebarState();
    }
  }

  closeMobileSidebar(): void {
    if (this.isMobile) {
      this.isMobileOpen = false;
    }
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.closeMobileSidebar();
  }

  logout(): void {
    this.authService.logout()
      .then(() => this.router.navigate(['/login']))
      .catch(err => console.error('Logout failed', err));
    this.closeMobileSidebar();
  }
}
