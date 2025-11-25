import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Book {
  id: string;
  title: string;
  authors: string[];
  categories: string[];
  publisher: string;
  isAvailable: boolean;
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
}