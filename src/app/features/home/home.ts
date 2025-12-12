import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { BookService, Book, BookDetails, CreateBookRequest, Category, OverdueUser, UserOverdueDetails } from '../../shared/services/book.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, DialogModule, MultiSelectModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private bookService = inject(BookService);
  private authService = inject(AuthService);
  private booksSignal = signal<Book[]>([]);
  search = signal('');
  selectedGenres = signal<string[]>([]);
  showFilter = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  
  // Modal states
  showBookModal = signal(false);
  selectedBook = signal<BookDetails | null>(null);
  isLoadingDetails = signal(false);
  detailsError = signal<string | null>(null);
  isBorrowing = signal(false);
  
  // Admin modal states
  showAddBookModal = signal(false);
  showUpdateCopiesModal = signal(false);
  showDeleteBookModal = signal(false);
  selectedBookForAdmin = signal<Book | null>(null);
  newBookCopies = signal<number>(0);
  
  // New book form
  newBookForm = signal<CreateBookRequest>({
    title: '',
    subtitle: null,
    isbn: null,
    summary: null,
    publisher: null,
    publicationDate: null,
    totalCopies: 1,
    authors: [],
    categories: []
  });
  newBookAuthorsInput = signal('');
  newBookCategoriesInput = signal('');
  
  // Categories for dropdown
  availableCategories = signal<Category[]>([]);
  selectedCategories = signal<Category[]>([]);
  isLoadingCategories = signal(false);
  
  // Notification modal
  showNotificationModal = signal(false);
  notificationMessage = signal('');
  notificationType = signal<'success' | 'error'>('success');

  isTitleChecking = signal(false);
  titleExists = signal(false);
  private titleCheckTimeout: any;

  showOverdueUsersModal = signal(false);
  showOverdueDetailsModal = signal(false);
  overdueUsers = signal<OverdueUser[]>([]);
  selectedUserOverdue = signal<UserOverdueDetails | null>(null);
  isLoadingOverdue = signal(false);
  
  // Admin check
  isAdmin = computed(() => this.authService.hasRole('admin'));

  ngOnInit() {
    this.loadBooks();
  }

  loadBooks() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    
    this.bookService.getCatalog().subscribe({
      next: (books) => {
        this.booksSignal.set(books);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading books:', error);
        this.errorMessage.set('Failed to load books. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  genres = computed(() => {
    const allGenres = this.booksSignal()
      .flatMap(b => Array.isArray(b.categories) ? b.categories : [b.categories])
      .filter(g => g && g.length > 0);
    
    const uniqueGenres = Array.from(new Set(allGenres)).sort();
    return uniqueGenres;
  });
  
  filteredBooks = computed(() => {
    let list = this.booksSignal();
    const q = this.search().trim().toLowerCase();
    if (q) {
      list = list.filter(b => {
        const authorString = Array.isArray(b.authors) ? b.authors.join(' ') : b.authors;
        return b.title.toLowerCase().includes(q) || 
               authorString.toLowerCase().includes(q);
      });
    }
    const genres = this.selectedGenres();
    if (genres.length) {
      list = list.filter(b => {
        const bookGenres = Array.isArray(b.categories) ? b.categories : [b.categories];
        return genres.some(selectedGenre => bookGenres.includes(selectedGenre));
      });
    }
    return list;
  });

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.search.set(value);
  }

  toggleGenre(genre: string) {
    const arr = [...this.selectedGenres()];
    const idx = arr.indexOf(genre);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(genre);
    this.selectedGenres.set(arr);
  }

  clearFilters() {
    this.search.set('');
    this.selectedGenres.set([]);
  }

  onRowAction(book: Book) {
    console.log('Opening modal for book:', book);
    this.showBookModal.set(true);
    this.isLoadingDetails.set(true);
    this.detailsError.set(null);
    this.selectedBook.set(null);

    console.log('Fetching details for book ID:', book.bookId);

    this.bookService.getBookDetails(book.bookId).subscribe({
      next: (details) => {
        this.selectedBook.set(details);
        this.isLoadingDetails.set(false);
      },
      error: (error) => {
        console.error('Error loading book details:', error);
        this.detailsError.set('Failed to load book details. Please try again.');
        this.isLoadingDetails.set(false);
      }
    });
  }

  closeModal() {
    this.showBookModal.set(false);
    this.selectedBook.set(null);
    this.detailsError.set(null);
    this.isLoadingDetails.set(false);
  }

  onBorrowBook() {
    const book = this.selectedBook();
    if (!book) return;

    // Get userId from sessionStorage (set during login)
    const userId = sessionStorage.getItem('userId');
    
    if (!userId) {
      this.detailsError.set('Please log in to borrow books.');
      return;
    }
    
    this.isBorrowing.set(true);
    this.detailsError.set(null);

    this.bookService.borrowBook(book.bookId, userId).subscribe({
      next: (response) => {
        // Update the book details with new available copies
        const updatedBook = {
          ...book,
          availableCopies: response.availableCopies,
          isAvailable: response.availableCopies > 0
        };
        this.selectedBook.set(updatedBook);

        // Update the catalog list
        this.booksSignal.set(
          this.booksSignal().map(b => 
            b.bookId === book.bookId 
              ? { ...b, isAvailable: response.availableCopies > 0 }
              : b
          )
        );

        this.isBorrowing.set(false);
        // Optionally show success message or close modal
      },
      error: (error) => {
        // Display the actual error message from the server
        const errorMsg = error.error?.message || error.error || 'Failed to borrow book. Please try again.';
        this.detailsError.set(errorMsg);
        this.isBorrowing.set(false);
      }
    });
  }

  // Admin Actions
  onAddBook() {
    console.log('Add book clicked');
    // Reset form
    this.newBookForm.set({
      title: '',
      subtitle: null,
      isbn: null,
      summary: null,
      publisher: null,
      publicationDate: null,
      totalCopies: 1,
      authors: [],
      categories: []
    });
    this.newBookAuthorsInput.set('');
    this.newBookCategoriesInput.set('');
    this.selectedCategories.set([]);
    
    // Load categories
    this.isLoadingCategories.set(true);
    this.bookService.getCategories().subscribe({
      next: (categories) => {
        this.availableCategories.set(categories);
        this.isLoadingCategories.set(false);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.isLoadingCategories.set(false);
        alert('Failed to load categories. Please try again.');
      }
    });
    
    this.showAddBookModal.set(true);
  }

  onUpdateBookCopies(book: Book) {
    console.log('Update book copies clicked for:', book);
    this.selectedBookForAdmin.set(book);
    this.newBookCopies.set(0);
    this.showUpdateCopiesModal.set(true);
  }

  onDeleteBook(book: Book) {
    console.log('Delete book clicked for:', book);
    this.selectedBookForAdmin.set(book);
    this.showDeleteBookModal.set(true);
  }

  // Admin modal actions
  confirmAddBook() {
    const formData = this.newBookForm();
    
    // Parse authors from comma-separated string
    const authorsInput = this.newBookAuthorsInput().trim();
    formData.authors = authorsInput ? authorsInput.split(',').map(a => a.trim()).filter(a => a) : [];
    
    // Get selected category names from the multiselect
    const selected = this.selectedCategories();
    formData.categories = selected.map(cat => cat.name);
    
    // Validation
    if (!formData.title || formData.authors.length === 0 || formData.categories.length === 0) {
      this.showNotification('Please fill in all required fields (Title, Authors, and Categories)', 'error');
      return;
    }
    
    this.bookService.createBook(formData).subscribe({
      next: (response) => {
        this.showNotification(response.message || 'Book added successfully!', 'success');
        this.loadBooks(); // Refresh the list
        this.showAddBookModal.set(false);
      },
      error: (error) => {
        console.error('Error adding book:', error);
        const errorMsg = error.error?.message || error.message || 'Failed to add book. Please try again.';
        this.showNotification(errorMsg, 'error');
      }
    });
  }

  confirmUpdateCopies() {
    const book = this.selectedBookForAdmin();
    const copies = this.newBookCopies();
    
    if (!book) return;
    
    if (copies < 0) {
      this.showNotification('Number of copies cannot be negative', 'error');
      return;
    }
    
    this.bookService.updateBookCopies(book.bookId, copies).subscribe({
      next: (response) => {
        this.showNotification(response.message || 'Book copies updated successfully!', 'success');
        this.loadBooks(); // Refresh the list
        this.showUpdateCopiesModal.set(false);
        this.selectedBookForAdmin.set(null);
      },
      error: (error) => {
        console.error('Error updating book copies:', error);
        const errorMsg = error.error?.message || error.message || 'Failed to update book copies. Please try again.';
        this.showNotification(errorMsg, 'error');
      }
    });
  }

  confirmDeleteBook() {
    const book = this.selectedBookForAdmin();
    if (book) {
      this.bookService.deleteBook(book.bookId).subscribe({
        next: (response) => {
          this.showNotification(response.message || 'Book deleted successfully!', 'success');
          this.loadBooks(); // Refresh the list
          this.showDeleteBookModal.set(false);
          this.selectedBookForAdmin.set(null);
        },
        error: (error) => {
          console.error('Error deleting book:', error);
          const errorMsg = error.error?.message || error.message || 'Failed to delete book. Please try again.';
          this.showNotification(errorMsg, 'error');
        }
      });
    }
  }

  closeAdminModals() {
    this.showAddBookModal.set(false);
    this.showUpdateCopiesModal.set(false);
    this.showDeleteBookModal.set(false);
    this.selectedBookForAdmin.set(null);
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
  onTitleEntering(event: Event) {
    const title = (event.target as HTMLInputElement).value.trim();
    this.newBookForm.update(form => ({ ...form, title }));

    if (!title) {
      this.titleExists.set(false);
      return;
    }
    if (this.titleCheckTimeout) {
    clearTimeout(this.titleCheckTimeout);
  }
    this.titleCheckTimeout = setTimeout(() => {
      this.checkBookTitle(title);
    }, 500);
  }
  checkBookTitle(title: string) {
    this.isTitleChecking.set(true);
    this.titleExists.set(false);
    this.bookService.checkBookTitleExists(title).subscribe({
      next: (response) => {
        this.titleExists.set(response.exists);
        this.isTitleChecking.set(false);
      },
      error: (error) => {
        console.error('Error checking book title:', error);
        this.isTitleChecking.set(false);
      }
    });
  }

  // Overdue Books Methods
  onViewOverdueBooks() {
    console.log('View overdue books clicked');
    this.isLoadingOverdue.set(true);
    this.overdueUsers.set([]);
    
    this.bookService.getOverdueUsers().subscribe({
      next: (users) => {
        this.overdueUsers.set(users);
        this.showOverdueUsersModal.set(true);
        this.isLoadingOverdue.set(false);
      },
      error: (error) => {
        console.error('Error loading overdue users:', error);
        const errorMsg = error.error?.message || error.message || 'Failed to load overdue books';
        this.showNotification(errorMsg, 'error');
        this.isLoadingOverdue.set(false);
      }
    });
  }

  onViewUserOverdueDetails(user: OverdueUser) {
    console.log('View user overdue details:', user);
    this.isLoadingOverdue.set(true);
    this.selectedUserOverdue.set(null);
    
    this.bookService.getUserOverdueBooks(user.userId).subscribe({
      next: (details) => {
        this.selectedUserOverdue.set(details);
        this.showOverdueDetailsModal.set(true);
        this.isLoadingOverdue.set(false);
      },
      error: (error) => {
        console.error('Error loading user overdue details:', error);
        const errorMsg = error.error?.message || error.message || 'Failed to load user details';
        this.showNotification(errorMsg, 'error');
        this.isLoadingOverdue.set(false);
      }
    });
  }

  closeOverdueModals() {
    this.showOverdueUsersModal.set(false);
    this.showOverdueDetailsModal.set(false);
    this.selectedUserOverdue.set(null);
  }
}
