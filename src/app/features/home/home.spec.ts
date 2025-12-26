import { TestBed, ComponentFixture, fakeAsync } from '@angular/core/testing';
import { Home } from './home';
import { BookService } from '../../shared/services/book.service';
import { AuthService } from '../../shared/services/auth.service';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let component: Home;
  let mockBookService: any;
  let mockAuth: any;

  beforeEach(() => {
    mockBookService = {
      getCatalog: jasmine.createSpy('getCatalog').and.returnValue(of([])),
      getBookDetails: jasmine.createSpy('getBookDetails').and.returnValue(of({ bookId: 1, title: 'T', availableCopies: 1 })),
      getCategories: jasmine.createSpy('getCategories').and.returnValue(of([])),
      borrowBook: jasmine.createSpy('borrowBook').and.returnValue(of({ availableCopies: 0 })),
      checkBookTitleExists: jasmine.createSpy('checkBookTitleExists').and.returnValue(of({ exists: false })),
      createBook: jasmine.createSpy('createBook').and.returnValue(of({ message: 'Success' })),
      updateBookCopies: jasmine.createSpy('updateBookCopies').and.returnValue(of({ message: 'Updated' })),
      deleteBook: jasmine.createSpy('deleteBook').and.returnValue(of({ message: 'Deleted' })),
      getOverdueUsers: jasmine.createSpy('getOverdueUsers').and.returnValue(of([])),
      getUserOverdueBooks: jasmine.createSpy('getUserOverdueBooks').and.returnValue(of({ userId: '1', books: [] }))
    };

    mockAuth = {
      hasRole: jasmine.createSpy('hasRole').and.returnValue(false)
    };

    TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        { provide: BookService, useValue: mockBookService },
        { provide: AuthService, useValue: mockAuth },
        provideHttpClient()
      ]
    });

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('computes genres from books', () => {
    const books = [
      { bookId: 1, title: 'A', categories: ['Sci'] },
      { bookId: 2, title: 'B', categories: ['Sci', 'Fiction'] }
    ];
    (component as any).booksSignal.set(books);
    const genres = component.genres();
    expect(genres).toContain('Sci');
    expect(genres).toContain('Fiction');
  });

  it('onSearch updates search signal', () => {
    const evt = { target: { value: 'hello' } } as any;
    component.onSearch(evt);
    expect(component.search()).toBe('hello');
  });

  it('toggleGenre adds/removes genres', () => {
    component.selectedGenres.set([]);
    component.toggleGenre('X');
    expect(component.selectedGenres()).toContain('X');
    component.toggleGenre('X');
    expect(component.selectedGenres()).not.toContain('X');
  });

  it('onRowAction loads book details and shows modal', fakeAsync(() => {
    const book = { bookId: 1, title: 'T' } as any;
    mockBookService.getBookDetails.and.returnValue(of({ bookId: 1, title: 'T' }));
    component.onRowAction(book);
    expect((component as any).showBookModal()).toBeTrue();
    expect((component as any).selectedBook()).toBeTruthy();
  }));

  it('filteredBooks filters by search term', () => {
    (component as any).booksSignal.set([
      { bookId: 1, title: 'Angular Guide', authors: ['John'], categories: ['Tech'] },
      { bookId: 2, title: 'React Basics', authors: ['Jane'], categories: ['Tech'] }
    ]);
    component.search.set('angular');
    const filtered = component.filteredBooks();
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe('Angular Guide');
  });

  it('filteredBooks filters by selected genres', () => {
    (component as any).booksSignal.set([
      { bookId: 1, title: 'A', categories: ['Sci-Fi'] },
      { bookId: 2, title: 'B', categories: ['Drama'] }
    ]);
    component.selectedGenres.set(['Sci-Fi']);
    const filtered = component.filteredBooks();
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe('A');
  });

  it('clearFilters resets search and genres', () => {
    component.search.set('test');
    component.selectedGenres.set(['X']);
    component.clearFilters();
    expect(component.search()).toBe('');
    expect(component.selectedGenres()).toEqual([]);
  });

  it('closeModal resets modal state', () => {
    (component as any).showBookModal.set(true);
    (component as any).selectedBook.set({ bookId: 1 });
    component.closeModal();
    expect((component as any).showBookModal()).toBeFalse();
    expect((component as any).selectedBook()).toBeNull();
  });

  it('onBorrowBook calls borrowBook service', () => {
    spyOn(sessionStorage, 'getItem').and.returnValue('user123');
    (component as any).selectedBook.set({ bookId: 1, title: 'Test', availableCopies: 5 });
    mockBookService.borrowBook.and.returnValue(of({ availableCopies: 4 }));
    
    component.onBorrowBook();
    
    expect(mockBookService.borrowBook).toHaveBeenCalledWith(1, 'user123');
    expect((component as any).selectedBook().availableCopies).toBe(4);
  });

  it('onBorrowBook shows error if not logged in', () => {
    spyOn(sessionStorage, 'getItem').and.returnValue(null);
    (component as any).selectedBook.set({ bookId: 1, title: 'Test' });
    
    component.onBorrowBook();
    
    expect((component as any).detailsError()).toBe('Please log in to borrow books.');
  });

  it('isAdmin computed reflects AuthService role', () => {
    // Initially false from setup
    expect(component.isAdmin()).toBeFalse();
    
    // When hasRole returns true
    mockAuth.hasRole.and.returnValue(true);
    // Create new component instance to pick up the new return value
    const newFixture = TestBed.createComponent(Home);
    const newComponent = newFixture.componentInstance;
    expect(newComponent.isAdmin()).toBeTrue();
  });

  it('showNotification sets message and type', () => {
    component.showNotification('Success!', 'success');
    expect((component as any).notificationMessage()).toBe('Success!');
    expect((component as any).notificationType()).toBe('success');
    expect((component as any).showNotificationModal()).toBeTrue();
  });

  it('confirmAddBook validates required fields', () => {
    (component as any).newBookForm.set({ title: '', authors: [], categories: [] });
    (component as any).newBookAuthorsInput.set('');
    (component as any).selectedCategories.set([]);
    
    spyOn(component, 'showNotification');
    component.confirmAddBook();
    
    expect(component.showNotification).toHaveBeenCalledWith(
      jasmine.stringContaining('required fields'),
      'error'
    );
  });

  it('confirmAddBook creates book with valid data', () => {
    (component as any).newBookForm.set({ title: 'New Book', authors: [], categories: [] });
    (component as any).newBookAuthorsInput.set('Author One, Author Two');
    (component as any).selectedCategories.set([{ id: 1, name: 'Fiction' }]);
    
    mockBookService.createBook.and.returnValue(of({ message: 'Book created' }));
    spyOn(component, 'loadBooks');
    
    component.confirmAddBook();
    
    expect(mockBookService.createBook).toHaveBeenCalledWith(
      jasmine.objectContaining({
        title: 'New Book',
        authors: ['Author One', 'Author Two'],
        categories: ['Fiction']
      })
    );
    expect(component.loadBooks).toHaveBeenCalled();
  });
});
