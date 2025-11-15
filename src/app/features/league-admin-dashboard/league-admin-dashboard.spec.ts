import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueAdminDashboard } from './league-admin-dashboard';

describe('LeagueAdminDashboard', () => {
  let component: LeagueAdminDashboard;
  let fixture: ComponentFixture<LeagueAdminDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueAdminDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeagueAdminDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
