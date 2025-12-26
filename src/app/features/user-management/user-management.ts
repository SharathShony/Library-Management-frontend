import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { UserService, User, UserBorrowedBook } from '../../shared/services/user.service';

@Component({
  selector: 'app-user-management',
  imports: [
    CommonModule,
    TableModule,
    DialogModule,
    ButtonModule,
    CardModule,
    TagModule,
    InputTextModule,
    TooltipModule
  ],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css',
})
export class UserManagement implements OnInit {
  users = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  
  // User details modal
  showUserDetailsModal = signal(false);
  selectedUser = signal<User | null>(null);
  userBorrowedBooks = signal<UserBorrowedBook[]>([]);
  isLoadingBooks = signal(false);
  booksErrorMessage = signal<string | null>(null);
  
  // Statistics
  totalUsers = signal(0);
  
  // Search
  searchTerm = signal('');

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.filteredUsers.set(users);
        this.calculateStatistics(users);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.errorMessage.set('Failed to load users. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  calculateStatistics(users: User[]) {
    this.totalUsers.set(users.length);
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm.set(value);
    
    if (!value.trim()) {
      this.filteredUsers.set(this.users());
      return;
    }
    
    const filtered = this.users().filter(user => 
      user.username.toLowerCase().includes(value) ||
      user.email.toLowerCase().includes(value) ||
      (user.role && user.role.toLowerCase().includes(value))
    );
    
    this.filteredUsers.set(filtered);
  }

  onUserClick(user: User) {
    this.selectedUser.set(user);
    this.showUserDetailsModal.set(true);
    this.loadUserBorrowedBooks(user.userId);
  }

  loadUserBorrowedBooks(userId: string) {
    this.isLoadingBooks.set(true);
    this.booksErrorMessage.set(null);
    this.userBorrowedBooks.set([]);
    
    this.userService.getUserBorrowedBooks(userId).subscribe({
      next: (books) => {
        this.userBorrowedBooks.set(books);
        this.isLoadingBooks.set(false);
      },
      error: (error) => {
        console.error('Error loading user borrowed books:', error);
        this.booksErrorMessage.set('Failed to load borrowed books.');
        this.isLoadingBooks.set(false);
      }
    });
  }

  closeUserDetailsModal() {
    this.showUserDetailsModal.set(false);
    this.selectedUser.set(null);
    this.userBorrowedBooks.set([]);
    this.booksErrorMessage.set(null);
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  getDaysOverdue(dueDate?: string): number {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }
}
