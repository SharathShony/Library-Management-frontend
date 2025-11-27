import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectButton } from 'primeng/selectbutton';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  imports: [CommonModule, CardModule, FormsModule, SelectButton],
})
export class Dashboard {
  userName: string = 'User';
  stateOptions: any[] = [
    { label: 'Currently Borrowed', value: 'currently-borrowed' },
    { label: 'Borrowing History', value: 'borrowing-history' }
  ];
  private _value: string = this.stateOptions[0].value; // Always select first option by default

  get value(): string {
    return this._value;
  }
  set value(val: string) {
    // Prevent deselection: if null/undefined, reset to first option
    if (val === null || val === undefined || val === '') {
      this._value = this.stateOptions[0].value;
    } else {
      this._value = val;
    }
  }

  constructor() {
    // Try localStorage first, then sessionStorage
    const userDataStr = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    if (userDataStr) {
      try {
        const user = JSON.parse(userDataStr);
        this.userName = user.name || user.username || 'User';
      } catch {
        this.userName = 'User';
      }
    }
  }
}