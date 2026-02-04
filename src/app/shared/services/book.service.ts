import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Book {
  bookId: string;
  title: string;
  authors: string[];
  categories: string[];
  publisher: string;
  isAvailable: boolean;
  isbn?: string;
  subtitle?: string | null;
}

export interface BookDetails {
  bookId: string;
  title: string;
  subtitle: string | null;
  isbn: string;
  summary: string;
  publisher: string;
  publicationDate: string;
  totalCopies: number;
  availableCopies: number;
  isAvailable: boolean;
  authors: string[];
  categories: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BorrowResponse {
  availableCopies: number;
  borrowingId: string;
}

export interface BorrowedBook {
  borrowingId: string;
  bookId: string;
  bookTitle: string;
  author: string;
  borrowDate: string;
  dueDate: string;
  isOverdue: boolean;
  isbn?: string;
  publisher?: string;
  summary?: string;
}

export interface BorrowingHistory {
  borrowingId: string;
  bookId: string;
  bookTitle: string;
  author: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string;
  status: string;
  wasOverdue: boolean;
  isbn?: string;
  publisher?: string;
  summary?: string;
}

export interface CreateBookRequest {
  title: string;
  subtitle?: string | null;
  isbn?: string | null;
  summary?: string | null;
  publisher?: string | null;
  publicationDate?: string | null;
  totalCopies: number;
  authors: string[];
  categories: string[];
}

export interface CreateBookResponse {
  bookId: string;
  message: string;
}

export interface UpdateBookCopiesRequest {
  totalCopies: number;
}

export interface UpdateBookCopiesResponse {
  totalCopies: number;
  availableCopies: number;
  message: string;
}

export interface Category {
  id: string;
  name: string;
}
export interface CheckBookTitleResponse{
  exists: boolean;
  message?: string;
}

export interface OverdueUser {
  userId: string;
  userName: string;
  email: string;
  overdueCount: number;
}

export interface OverdueBookDetail {
  borrowingId: string;
  bookId: string;
  bookTitle: string;
  borrowedDate: string;
  dueDate: string;
  daysOverdue: number;
}

export interface UserOverdueDetails {
  userId: string;
  userName: string;
  email: string;
  overdueBooks: OverdueBookDetail[];
}

export interface PendingBorrowRequest {
  borrowingId: string;
  userName: string;
  userEmail: string;
  bookTitle: string;
  bookId: string;
  requestedDate: string;
  dueDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private apiUrl = 'http://localhost:5164/api/Books';
  private categoriesApiUrl = 'http://localhost:5164/api/Categories';

  constructor(private http: HttpClient) {}

  getCatalog(): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.apiUrl}/catalog`);
  }

  getBookDetails(bookId: string): Observable<BookDetails> {
    return this.http.get<BookDetails>(`${this.apiUrl}/${bookId}/details`);
  }

  // POST /api/Books/{bookId}/borrow
  borrowBook(bookId: string, userId: string, dueDate?: string): Observable<BorrowResponse> {
    const body: any = { userId };
    if (dueDate) body.dueDate = dueDate;
    return this.http.post<BorrowResponse>(`${this.apiUrl}/${bookId}/borrow`, body);
  }
  getCurrentlyBorrowedCount(userId: string) {
  return this.http.get<{ count: number }>(
    `http://localhost:5164/api/Borrowings/currently-borrowed/count?userId=${userId}`
  );
}
getReturnedBooksCount(userId: string) {
  return this.http.get<{ count: number }>(
    `http://localhost:5164/api/Borrowings/returned/count?userId=${userId}`
  );
}
getOverdueBooksCount(userId: string) {
  return this.http.get<{ count: number }>(
    `http://localhost:5164/api/Borrowings/overdue/count?userId=${userId}`
  );
}
getCurrentlyBorrowedBooks(userId: string): Observable<BorrowedBook[]> {
  return this.http.get<BorrowedBook[]>(
    `http://localhost:5164/api/Borrowings/currently-borrowed?userId=${userId}`
  );
}

getBorrowingHistory(userId: string): Observable<BorrowingHistory[]> {
  return this.http.get<BorrowingHistory[]>(
    `http://localhost:5164/api/Borrowings/history?userId=${userId}`
  );
}
returnBook(borrowingId: string) {
  return this.http.post<{
    borrowingId: string;
    bookId: string;
    returnDate: string;
    availableCopies: number;
    message: string;
  }>(
    `http://localhost:5164/api/Borrowings/${borrowingId}/return`,
    {}
  );
}

extendBook(borrowingId: string, extensionDays: number = 7) {
  return this.http.post<{
    borrowingId: string;
    newDueDate: string;
    extensionDays: number;
    message: string;
  }>(
    `http://localhost:5164/api/Borrowings/${borrowingId}/extend?extensionDays=${extensionDays}`,
    {}
  );
}

// Admin endpoints
createBook(request: CreateBookRequest): Observable<CreateBookResponse> {
  return this.http.post<CreateBookResponse>(`${this.apiUrl}`, request);
}

updateBookCopies(bookId: string, totalCopies: number): Observable<UpdateBookCopiesResponse> {
  return this.http.put<UpdateBookCopiesResponse>(
    `${this.apiUrl}/${bookId}/copies`, 
    { totalCopies }
  );
}

deleteBook(bookId: string): Observable<{ message: string }> {
  return this.http.delete<{ message: string }>(`${this.apiUrl}/${bookId}`);
}

// Categories endpoint
getCategories(): Observable<Category[]> {
  return this.http.get<Category[]>(this.categoriesApiUrl);
}
checkBookTitleExists(title: string): Observable<CheckBookTitleResponse> {
  return this.http.get<CheckBookTitleResponse>(`${this.apiUrl}/check-title?title=${encodeURIComponent(title)}`);
}

// Admin: Get users with overdue books
getOverdueUsers(): Observable<OverdueUser[]> {
  return this.http.get<OverdueUser[]>('http://localhost:5164/api/Admin/overdue-users');
}

// Admin: Get overdue books for a specific user
getUserOverdueBooks(userId: string): Observable<UserOverdueDetails> {
  return this.http.get<UserOverdueDetails>(`http://localhost:5164/api/Admin/overdue-books/${userId}`);
}

// Admin: Get pending borrowing requests
getPendingRequests(): Observable<PendingBorrowRequest[]> {
  return this.http.get<PendingBorrowRequest[]>('http://localhost:5164/api/Admin/borrowing-requests/pending');
}

// Admin: Approve borrowing request
approveRequest(borrowingId: string): Observable<{ message: string; borrowingId: string }> {
  return this.http.post<{ message: string; borrowingId: string }>(
    `http://localhost:5164/api/Admin/borrowing-requests/${borrowingId}/approve`,
    {}
  );
}

// Admin: Reject borrowing request
rejectRequest(borrowingId: string, reason: string): Observable<{ message: string }> {
  return this.http.post<{ message: string }>(
    `http://localhost:5164/api/Admin/borrowing-requests/${borrowingId}/reject`,
    { reason }
  );
}
}