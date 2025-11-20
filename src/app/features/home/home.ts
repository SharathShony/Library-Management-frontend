import { Component,signal,computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgForOf, NgIf } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';


interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink,NgForOf,NgIf,ButtonModule,TableModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
    private booksSignal = signal<Book[]>([
    { id: '1', title: 'Angular Essentials', author: 'Jane Doe', genre: 'Programming' },
    { id: '2', title: 'TypeScript Deep Dive', author: 'John Smith', genre: 'Programming' },
    { id: '3', title: 'Mystery of the Library', author: 'A. Writer', genre: 'Fiction' },
    { id: '4', title: 'Cooking 101', author: 'Chef Good', genre: 'Cooking' },
    { id: '5', title: 'Modern Poetry', author: 'L. Poet', genre: 'Poetry' },
  ]);
  search = signal('');
  selectedGenres = signal<string[]>([]);
  sortOption = signal<string | null>(null);
  showFilter = signal(false);
  showSort = signal(false);

  // derived data
  genres = computed(() => {
    const set = new Set(this.booksSignal().map(b => b.genre));
    console.log('Available genres:', Array.from(set).sort());
    return Array.from(set).sort();
  });
  
  filteredBooks = computed(() => {
    let list = this.booksSignal();
    const q = this.search().trim().toLowerCase();
    if (q) {
      list = list.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
    }
    const genres = this.selectedGenres();
    if (genres.length) {
      list = list.filter(b => genres.includes(b.genre));
    }
    console.log('Books after filtering:', list);
    const s = this.sortOption();
    if (s === 'authorAsc') list = [...list].sort((a, b) => a.author.localeCompare(b.author));
    if (s === 'authorDesc') list = [...list].sort((a, b) => b.author.localeCompare(a.author));
    if (s === 'titleAsc') list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    if (s === 'titleDesc') list = [...list].sort((a, b) => b.title.localeCompare(a.title));

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

  setSort(option: string) {
    this.sortOption.set(option);
    this.showSort.set(false);
  }
  clearFilters() {
    this.search.set('');
    this.selectedGenres.set([]);
    this.sortOption.set(null);
  }
  onRowAction(book: Book) {
    console.log('Row action clicked for book:', book);
    // Example: navigate to book detail
    // this.router.navigate(['/books', book.id]);
  }
}
