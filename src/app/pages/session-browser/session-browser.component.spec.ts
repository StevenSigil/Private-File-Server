import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionBrowserComponent } from './session-browser.component';

describe('SessionBrowserComponent', () => {
  let component: SessionBrowserComponent;
  let fixture: ComponentFixture<SessionBrowserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SessionBrowserComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SessionBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
