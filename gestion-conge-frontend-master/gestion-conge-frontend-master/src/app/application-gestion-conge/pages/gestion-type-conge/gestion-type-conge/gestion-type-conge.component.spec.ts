import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionTypeCongeComponent } from './gestion-type-conge.component';

describe('GestionTypeCongeComponent', () => {
  let component: GestionTypeCongeComponent;
  let fixture: ComponentFixture<GestionTypeCongeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GestionTypeCongeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionTypeCongeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
