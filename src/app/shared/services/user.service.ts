import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  userId: string;
  username: string;
  email: string;
  role?: string;
  createdAt?: string;
  currentBorrowedCount?: number;
  totalBorrowedCount?: number;
}

export interface UserBorrowedBook {
  borrowingId: string;
  bookId: string;
  bookTitle: string;
  bookIsbn?: string;
  borrowedDate: string;
  dueDate: string;
  returnedDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:5164/api';

  constructor(private http: HttpClient) {}

  /**
   * Get all users (Admin only)
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/Admin/users`);
  }

  /**
   * Get a specific user by ID (Admin only)
   */
  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/Admin/users/${userId}`);
  }

  /**
   * Get all books borrowed by a specific user (Admin only)
   */
  getUserBorrowedBooks(userId: string): Observable<UserBorrowedBook[]> {
    return this.http.get<UserBorrowedBook[]>(`${this.apiUrl}/Admin/users/${userId}/borrowed-books`);
  }

  /**
   * Update user status (Admin only)
   */
  updateUserStatus(userId: string, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/Admin/users/${userId}/status`, { status });
  }

  /**
   * Delete a user (Admin only)
   */
  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Admin/users/${userId}`);
  }
}
