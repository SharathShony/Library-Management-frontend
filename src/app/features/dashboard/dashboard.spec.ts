import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { BookService } from '../../shared/services/book.service';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let mockBookService: any;

  beforeEach(async () => {
    mockBookService = {
      getCurrentlyBorrowedCount: jasmine.createSpy('getCurrentlyBorrowedCount').and.returnValue(of({ count: 3 })),
      getReturnedBooksCount: jasmine.createSpy('getReturnedBooksCount').and.returnValue(of({ count: 10 })),
      getOverdueBooksCount: jasmine.createSpy('getOverdueBooksCount').and.returnValue(of({ count: 1 })),
      getCurrentlyBorrowedBooks: jasmine.createSpy('getCurrentlyBorrowedBooks').and.returnValue(of([])),
      getBorrowingHistory: jasmine.createSpy('getBorrowingHistory').and.returnValue(of([]))
    };

    // Mock localStorage
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ id: 'user123', name: 'Test User' }));

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: BookService, useValue: mockBookService },
        provideHttpClient()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user data from localStorage on init', () => {
    expect(component.userName).toBe('Test User');
    expect(component.userId).toBe('user123');
  });

  it('should fetch dashboard statistics on init', () => {
    expect(mockBookService.getCurrentlyBorrowedCount).toHaveBeenCalledWith('user123');
    expect(mockBookService.getReturnedBooksCount).toHaveBeenCalledWith('user123');
    expect(mockBookService.getOverdueBooksCount).toHaveBeenCalledWith('user123');
  });

  it('should update counts from API responses', () => {
    expect(component.currentlyBorrowedCount).toBe(3);
    expect(component.totalBooksRead).toBe(10);
    expect(component.overdueBooksCount).toBe(1);
  });

  it('should handle value setter and default to first option', () => {
    component.value = '';
    expect(component.value).toBe('currently-borrowed');
    
    component.value = null as any;
    expect(component.value).toBe('currently-borrowed');
  });

  it('should load borrowed books when switching to currently-borrowed tab', () => {
    mockBookService.getCurrentlyBorrowedBooks.calls.reset();
    component.value = 'currently-borrowed';
    expect(mockBookService.getCurrentlyBorrowedBooks).toHaveBeenCalledWith('user123');
  });

  it('should load history when switching to borrowing-history tab', () => {
    component.value = 'borrowing-history';
    expect(mockBookService.getBorrowingHistory).toHaveBeenCalledWith('user123');
  });

  it('should handle API errors gracefully', () => {
    mockBookService.getCurrentlyBorrowedCount.and.returnValue(throwError(() => new Error('API Error')));
    component.ngOnInit();
    expect(component.currentlyBorrowedCount).toBe(0);
  });
});
