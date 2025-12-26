import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Login } from './login';
import { AuthService } from '../../shared/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockAuthService = {
      loginWithApi: jasmine.createSpy('loginWithApi').and.returnValue(of({ token: 'fake-token' }))
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate'),
      createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue({}),
      serializeUrl: jasmine.createSpy('serializeUrl').and.returnValue('/mock-url'),
      events: new Subject()
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { snapshot: {}, params: of({}), queryParams: of({}) } },
        provideHttpClient()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show error when email or password is missing', () => {
    component.onSubmit(new Event('submit'), '', 'password');
    expect(component.errorMessage()).toBe('Please enter email and password');
    
    component.errorMessage.set('');
    component.onSubmit(new Event('submit'), 'email@test.com', '');
    expect(component.errorMessage()).toBe('Please enter email and password');
  });

  it('should call loginWithApi and navigate on successful login', () => {
    mockAuthService.loginWithApi.and.returnValue(of({ token: 'fake-token' }));
    
    component.onSubmit(new Event('submit'), 'test@example.com', 'password123');
    
    expect(mockAuthService.loginWithApi).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
    expect(component.isLoading()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should display error message on login failure', () => {
    const errorResponse = { error: { message: 'Invalid credentials' } };
    mockAuthService.loginWithApi.and.returnValue(throwError(() => errorResponse));
    
    component.onSubmit(new Event('submit'), 'test@example.com', 'wrongpassword');
    
    expect(component.errorMessage()).toBe('Invalid credentials');
    expect(component.isLoading()).toBe(false);
  });

  it('should handle generic login error', () => {
    mockAuthService.loginWithApi.and.returnValue(throwError(() => ({ error: {} })));
    
    component.onSubmit(new Event('submit'), 'test@example.com', 'password');
    
    expect(component.errorMessage()).toBe('Login failed. Please try again.');
  });
});
