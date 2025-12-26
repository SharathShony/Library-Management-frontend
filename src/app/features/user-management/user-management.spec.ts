import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserManagement } from './user-management';
import { UserService } from '../../shared/services/user.service';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';

describe('UserManagement', () => {
  let component: UserManagement;
  let fixture: ComponentFixture<UserManagement>;
  let mockUserService: any;

  beforeEach(async () => {
    mockUserService = {
      getAllUsers: jasmine.createSpy('getAllUsers').and.returnValue(of([])),
      getUserBorrowedBooks: jasmine.createSpy('getUserBorrowedBooks').and.returnValue(of([]))
    };

    await TestBed.configureTestingModule({
      imports: [UserManagement],
      providers: [
        { provide: UserService, useValue: mockUserService },
        provideHttpClient()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserManagement);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    const mockUsers = [
      { userId: '1', username: 'user1', email: 'user1@test.com', role: 'User' },
      { userId: '2', username: 'admin', email: 'admin@test.com', role: 'Admin' }
    ];
    mockUserService.getAllUsers.and.returnValue(of(mockUsers));

    component.ngOnInit();

    expect(mockUserService.getAllUsers).toHaveBeenCalled();
    expect(component.users()).toEqual(mockUsers);
    expect(component.totalUsers()).toBe(2);
  });

  it('should calculate statistics correctly', () => {
    const users = [
      { userId: '1', username: 'user1', email: 'user1@test.com' },
      { userId: '2', username: 'user2', email: 'user2@test.com' },
      { userId: '3', username: 'user3', email: 'user3@test.com' }
    ];

    component.calculateStatistics(users);

    expect(component.totalUsers()).toBe(3);
  });

  it('should filter users by search term', () => {
    const users = [
      { userId: '1', username: 'john', email: 'john@test.com', role: 'User' },
      { userId: '2', username: 'jane', email: 'jane@test.com', role: 'Admin' }
    ];
    component.users.set(users);
    component.filteredUsers.set(users);

    const event = { target: { value: 'john' } } as any;
    component.onSearchInput(event);

    expect(component.filteredUsers().length).toBe(1);
    expect(component.filteredUsers()[0].username).toBe('john');
  });

  it('should open user details modal and load borrowed books', () => {
    const user = { userId: '1', username: 'test', email: 'test@test.com' };
    const borrowedBooks = [
      { borrowingId: '1', bookId: 'b1', bookTitle: 'Book 1', borrowedDate: '2024-01-01', dueDate: '2024-01-15' }
    ];
    mockUserService.getUserBorrowedBooks.and.returnValue(of(borrowedBooks));

    component.onUserClick(user);

    expect(component.selectedUser()).toEqual(user);
    expect(component.showUserDetailsModal()).toBeTrue();
    expect(mockUserService.getUserBorrowedBooks).toHaveBeenCalledWith('1');
  });

  it('should handle error when loading users', () => {
    mockUserService.getAllUsers.and.returnValue(throwError(() => new Error('API Error')));

    component.loadUsers();

    expect(component.errorMessage()).toBe('Failed to load users. Please try again.');
    expect(component.isLoading()).toBeFalse();
  });

  it('should format date correctly', () => {
    const dateStr = '2024-01-15T00:00:00';
    const formatted = component.formatDate(dateStr);
    expect(formatted).toContain('Jan');
    expect(formatted).toContain('15');
  });

  it('should calculate days overdue', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const days = component.getDaysOverdue(pastDate.toISOString());
    expect(days).toBeGreaterThanOrEqual(5);
  });

  it('should close user details modal', () => {
    component.showUserDetailsModal.set(true);
    component.selectedUser.set({ userId: '1', username: 'test', email: 'test@test.com' });

    component.closeUserDetailsModal();

    expect(component.showUserDetailsModal()).toBeFalse();
    expect(component.selectedUser()).toBeNull();
  });
});
