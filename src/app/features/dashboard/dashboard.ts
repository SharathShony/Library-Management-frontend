import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectButton } from 'primeng/selectbutton';
import { BookService, BorrowedBook } from '../../shared/services/book.service';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  imports: [CommonModule, CardModule, FormsModule, SelectButton],
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
  userId: string = '';

  get value(): string {
    return this._value;
  }
  set value(val: string) {
    if (val === null || val === undefined || val === '') {
      this._value = this.stateOptions[0].value;
    } else {
      this._value = val;
      // Load currently borrowed books when tab is selected
      if (val === 'currently-borrowed' && this.userId) {
        this.loadCurrentlyBorrowedBooks();
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

  returnBook(borrowingId: string) {
    console.log('Return book:', borrowingId);
    // TODO: Call API to return book
  }

  extendBook(borrowingId: string) {
    console.log('Extend book:', borrowingId);
    // TODO: Call API to extend due date
  }
}