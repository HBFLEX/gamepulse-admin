import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentAdminDashboard } from './content-admin-dashboard';

describe('ContentAdminDashboard', () => {
  let component: ContentAdminDashboard;
  let fixture: ComponentFixture<ContentAdminDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentAdminDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContentAdminDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
