import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { Signup } from './signup';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { of, throwError, Subject } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';

describe('Signup', () => {
  let fixture: ComponentFixture<Signup>;
  let component: Signup;
  let mockAuth: any;
  let mockRouter: any;

  beforeEach(() => {
    mockAuth = {
      signupWithApi: jasmine.createSpy('signupWithApi').and.returnValue(of({}))
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate'),
      createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue({}),
      serializeUrl: jasmine.createSpy('serializeUrl').and.returnValue('/mock-url'),
      events: new Subject()
    };

    TestBed.configureTestingModule({
      imports: [Signup],
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { snapshot: {}, params: of({}), queryParams: of({}) } },
        provideHttpClient()
      ]
    });

    fixture = TestBed.createComponent(Signup);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('validates password rules', () => {
    expect(component.isPasswordValid('Abcdef1!')).toBeTrue();
    expect(component.isPasswordValid('short')).toBeFalse();
    expect(component.isPasswordValid('NoDigits!!')).toBeFalse();
  });

  it('shows error when fields missing', () => {
    component.onSubmit(new Event('submit'), '', 'a@b.com', 'Pass123!', 'Pass123!');
    expect(component.errorMessage()).toBe('Please fill in all fields');
  });

  it('shows error when passwords do not match', () => {
    component.onSubmit(new Event('submit'), 'user', 'a@b.com', 'Pass123!', 'Other123!');
    expect(component.errorMessage()).toBe('Passwords do not match');
  });

  it('shows error when password invalid', () => {
    component.onSubmit(new Event('submit'), 'user', 'a@b.com', 'weak', 'weak');
    expect(component.errorMessage()).toBe('Password does not meet all requirements');
  });

  it('calls auth and navigates on successful signup', fakeAsync(() => {
    mockAuth.signupWithApi.and.returnValue(of({}));
    const evt = new Event('submit');
    component.onSubmit(evt, 'user', 'a@b.com', 'Abcd1234!', 'Abcd1234!');

    // successMessage should be set and navigation scheduled
    expect(component.isLoading()).toBeFalse();
    expect(component.successMessage()).toContain('Account created successfully');

    // advance timers for redirect
    tick(2000);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('handles 400 validation errors from backend', () => {
    const backendError = { status: 400, error: { errors: { email: ['Invalid email'] } } };
    mockAuth.signupWithApi.and.returnValue(throwError(() => backendError));

    component.onSubmit(new Event('submit'), 'user', 'a@b.com', 'Abcd1234!', 'Abcd1234!');
    expect(component.errorMessage()).toContain('Invalid email');
  });
});
