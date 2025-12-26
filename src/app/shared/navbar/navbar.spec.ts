import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Navbar } from './navbar';
import { AuthService } from '../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { of, Subject } from 'rxjs';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockAuthService = {
      currentUser: signal({ name: 'Test User', role: 'user' }),
      isAuthenticated: signal(true),
      logout: jasmine.createSpy('logout')
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate'),
      createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue({}),
      serializeUrl: jasmine.createSpy('serializeUrl').and.returnValue('/mock-url'),
      events: new Subject()
    };

    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { snapshot: {}, params: of({}), queryParams: of({}) } },
        provideHttpClient()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display userName from computed signal', () => {
    expect(component.userName()).toBe('Test User');
  });

  it('should display userRole from computed signal', () => {
    expect(component.userRole()).toBe('user');
  });

  it('should call logout and navigate on handleLogout', () => {
    component.handleLogout();
    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should handle missing user data gracefully', () => {
    mockAuthService.currentUser.set(null);
    expect(component.userName()).toBe('User');
    expect(component.userRole()).toBe('Guest');
  });
});
