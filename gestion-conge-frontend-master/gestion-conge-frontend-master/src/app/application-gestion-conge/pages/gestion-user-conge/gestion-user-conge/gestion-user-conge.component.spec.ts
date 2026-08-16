import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionUserCongeComponent } from './gestion-user-conge.component';

describe('GestionUserCongeComponent', () => {
  let component: GestionUserCongeComponent;
  let fixture: ComponentFixture<GestionUserCongeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GestionUserCongeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionUserCongeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
