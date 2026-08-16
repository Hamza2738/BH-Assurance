import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionGradeComponent } from './gestion-grade.component';

describe('GestionGradeComponent', () => {
  let component: GestionGradeComponent;
  let fixture: ComponentFixture<GestionGradeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GestionGradeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionGradeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
