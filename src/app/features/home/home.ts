import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { NgForOf, NgIf, DatePipe } from '@angular/common';  // Added DatePipe
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { BookService, Book, BookDetails } from '../../shared/services/book.service';

@Component({
  selector: 'app-home',
  imports: [NgForOf, NgIf, ButtonModule, TableModule, DialogModule, DatePipe],  // Added DatePipe
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private bookService = inject(BookService);
  private booksSignal = signal<Book[]>([]);
  search = signal('');
  selectedGenres = signal<string[]>([]);
  showFilter = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  
  // Modal states - CHANGED TYPE FROM Book TO BookDetails
  showBookModal = signal(false);
  selectedBook = signal<BookDetails | null>(null);
  isLoadingDetails = signal(false);  // ADDED THIS
  detailsError = signal<string | null>(null);  // ADDED THIS

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

  // derived data
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

  // ADDED THIS METHOD
  onRowAction(book: Book) {
    console.log('Opening modal for book:', book);
    this.showBookModal.set(true);
    this.isLoadingDetails.set(true);
    this.detailsError.set(null);
    this.selectedBook.set(null);

    console.log('Fetching details for book ID:', book.bookId);
    this.bookService.getBookDetails(book.bookId).subscribe({
      next: (details) => {
        console.log('Book details received:', details);
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

  // ADDED THIS METHOD
  closeModal() {
    this.showBookModal.set(false);
    this.selectedBook.set(null);
    this.detailsError.set(null);
    this.isLoadingDetails.set(false);
  }
}
