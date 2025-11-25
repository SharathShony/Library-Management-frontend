import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgForOf, NgIf } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { BookService, Book } from '../../shared/services/book.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink, NgForOf, NgIf, ButtonModule, TableModule],
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
        // Handle categories as an array
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
    console.log('Row action clicked for book:', book);
    // Example: navigate to book detail
    // this.router.navigate(['/books', book.id]);
  }
}
