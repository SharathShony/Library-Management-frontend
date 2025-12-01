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
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private apiUrl = 'https://localhost:7159/api/Books';

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
    `https://localhost:7159/api/Borrowings/currently-borrowed/count?userId=${userId}`
  );
}
getReturnedBooksCount(userId: string) {
  return this.http.get<{ count: number }>(
    `https://localhost:7159/api/Borrowings/returned/count?userId=${userId}`
  );
}
getOverdueBooksCount(userId: string) {
  return this.http.get<{ count: number }>(
    `https://localhost:7159/api/Borrowings/overdue/count?userId=${userId}`
  );
}
getCurrentlyBorrowedBooks(userId: string): Observable<BorrowedBook[]> {
  return this.http.get<BorrowedBook[]>(
    `https://localhost:7159/api/Borrowings/currently-borrowed?userId=${userId}`
  );
}
}