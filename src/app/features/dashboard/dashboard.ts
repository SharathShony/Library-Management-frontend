import { Component, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectButton } from 'primeng/selectbutton';
import { DialogModule } from 'primeng/dialog';
import { BookService, BorrowedBook, BorrowingHistory } from '../../shared/services/book.service';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  imports: [CommonModule, CardModule, FormsModule, SelectButton, DialogModule],
})
export class Dashboard implements OnInit {
  userName: string = 'User';
  stateOptions: any[] = [
    { label: 'Currently Borrowed', value: 'currently-borrowed' },
    { label: 'Borrowing History', value: 'borrowing-history' }
  ];
  private _value: string = this.stateOptions[0].value; 
  currentlyBorrowedCount: number = 0;
  totalBooksRead: number = 0; 
  overdueBooksCount: number = 0; 
  currentlyBorrowedBooks: BorrowedBook[] = [];
  borrowingHistory: BorrowingHistory[] = [];
  userId: string = '';
  
  // Modal state
  showBookDetailsModal: boolean = false;
  selectedBook: BorrowedBook | null = null;
  
  // Notification modal
  showNotificationModal = signal(false);
  notificationMessage = signal('');
  notificationType = signal<'success' | 'error'>('success');
  
  // Confirmation modal
  showConfirmModal = signal(false);
  confirmMessage = signal('');
  confirmAction = signal<'return' | 'extend' | null>(null);
  pendingBorrowingId = signal<string | null>(null);

  get value(): string {
    return this._value;
  }
  set value(val: string) {
    if (val === null || val === undefined || val === '') {
      this._value = this.stateOptions[0].value;
    } else {
      this._value = val;
      // Load data when tab is selected
      if (val === 'currently-borrowed' && this.userId) {
        this.loadCurrentlyBorrowedBooks();
      } else if (val === 'borrowing-history' && this.userId) {
        this.loadBorrowingHistory();
      }
    }
  }

  constructor(private bookService: BookService) {
    // Try localStorage first, then sessionStorage
    const userDataStr = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    if (userDataStr) {
      try {
        const user = JSON.parse(userDataStr);
        this.userName = user.name || user.username || 'User';
      } catch {
        this.userName = 'User';
      }
    }
  }

  ngOnInit() {
    // Get userId from storage
    const userDataStr = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    if (userDataStr) {
      try {
        const user = JSON.parse(userDataStr);
        this.userId = user.id;
        this.userName = user.name || user.username || 'User';
      } catch {
        this.userName = 'User';
      }
    }

    if (this.userId) {
      this.bookService.getCurrentlyBorrowedCount(this.userId).subscribe({
        next: (res) => this.currentlyBorrowedCount = res.count,
        error: () => this.currentlyBorrowedCount = 0
      });

      this.bookService.getReturnedBooksCount(this.userId).subscribe({
        next: (res) => this.totalBooksRead = res.count,
        error: () => this.totalBooksRead = 0
      });

      // Fetch overdue books count
      this.bookService.getOverdueBooksCount(this.userId).subscribe({
        next: (res) => this.overdueBooksCount = res.count,
        error: () => this.overdueBooksCount = 0
      });

      // Load currently borrowed books if the tab is selected
      if (this.value === 'currently-borrowed') {
        this.loadCurrentlyBorrowedBooks();
      }
    }
  }

  loadCurrentlyBorrowedBooks() {
    if (this.userId) {
      this.bookService.getCurrentlyBorrowedBooks(this.userId).subscribe({
        next: (books) => this.currentlyBorrowedBooks = books,
        error: () => this.currentlyBorrowedBooks = []
      });
    }
  }

  loadBorrowingHistory() {
    if (this.userId) {
      this.bookService.getBorrowingHistory(this.userId).subscribe({
        next: (history) => this.borrowingHistory = history,
        error: () => this.borrowingHistory = []
      });
    }
  }

  openBookDetails(book: BorrowedBook) {
    this.selectedBook = book;
    this.showBookDetailsModal = true;
  }

  returnBook(borrowingId: string) {
    this.pendingBorrowingId.set(borrowingId);
    this.confirmMessage.set('Are you sure you want to return this book?');
    this.confirmAction.set('return');
    this.showConfirmModal.set(true);
  }

  confirmReturnBook() {
    const borrowingId = this.pendingBorrowingId();
    if (!borrowingId) return;

    this.bookService.returnBook(borrowingId).subscribe({
      next: (response) => {
        // Refresh the borrowed books list
        this.loadCurrentlyBorrowedBooks();
        
        // Refresh the dashboard counts
        if (this.userId) {
          this.bookService.getCurrentlyBorrowedCount(this.userId).subscribe({
            next: (res) => this.currentlyBorrowedCount = res.count,
            error: () => this.currentlyBorrowedCount = 0
          });

          this.bookService.getReturnedBooksCount(this.userId).subscribe({
            next: (res) => this.totalBooksRead = res.count,
            error: () => this.totalBooksRead = 0
          });

          this.bookService.getOverdueBooksCount(this.userId).subscribe({
            next: (res) => this.overdueBooksCount = res.count,
            error: () => this.overdueBooksCount = 0
          });
        }
        
        // Close modal if open
        this.showBookDetailsModal = false;
        this.showNotification('Book returned successfully!', 'success');
      },
      error: (error) => {
        console.error('Failed to return book:', error);
        this.showNotification(error?.error?.message || 'Failed to return book. Please try again.', 'error');
      }
    });
  }

  extendBook(borrowingId: string) {
    this.pendingBorrowingId.set(borrowingId);
    this.confirmMessage.set('Are you sure you want to extend the due date by 7 days?');
    this.confirmAction.set('extend');
    this.showConfirmModal.set(true);
  }

  confirmExtendBook() {
    const borrowingId = this.pendingBorrowingId();
    if (!borrowingId) return;

    this.bookService.extendBook(borrowingId, 7).subscribe({
      next: (response) => {
        // Refresh the borrowed books list to show new due date
        this.loadCurrentlyBorrowedBooks();
        
        // Refresh overdue count in case it changed
        if (this.userId) {
          this.bookService.getOverdueBooksCount(this.userId).subscribe({
            next: (res) => this.overdueBooksCount = res.count,
            error: () => this.overdueBooksCount = 0
          });
        }
        
        // Close modal if open
        this.showBookDetailsModal = false;
        this.showNotification('Due date extended successfully!', 'success');
      },
      error: (error) => {
        console.error('Failed to extend due date:', error);
        this.showNotification(error?.error?.message || 'Failed to extend due date. Please try again.', 'error');
      }
    });
  }

  // Notification methods
  showNotification(message: string, type: 'success' | 'error') {
    this.notificationMessage.set(message);
    this.notificationType.set(type);
    this.showNotificationModal.set(true);
  }

  closeNotification() {
    this.showNotificationModal.set(false);
    this.notificationMessage.set('');
  }

  // Confirmation modal methods
  onConfirm() {
    this.showConfirmModal.set(false);
    const action = this.confirmAction();
    
    if (action === 'return') {
      this.confirmReturnBook();
    } else if (action === 'extend') {
      this.confirmExtendBook();
    }
    
    // Reset
    this.confirmAction.set(null);
    this.pendingBorrowingId.set(null);
  }

  onCancelConfirm() {
    this.showConfirmModal.set(false);
    this.confirmAction.set(null);
    this.pendingBorrowingId.set(null);
  }
}