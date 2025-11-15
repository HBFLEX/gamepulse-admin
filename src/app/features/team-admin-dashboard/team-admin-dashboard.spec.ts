import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamAdminDashboard } from './team-admin-dashboard';

describe('TeamAdminDashboard', () => {
  let component: TeamAdminDashboard;
  let fixture: ComponentFixture<TeamAdminDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamAdminDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamAdminDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
