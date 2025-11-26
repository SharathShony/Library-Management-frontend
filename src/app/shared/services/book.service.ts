import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';  // Changed from @angular/common
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
}