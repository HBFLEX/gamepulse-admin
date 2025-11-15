import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameAdminDashboard } from './game-admin-dashboard';

describe('GameAdminDashboard', () => {
  let component: GameAdminDashboard;
  let fixture: ComponentFixture<GameAdminDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameAdminDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameAdminDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
