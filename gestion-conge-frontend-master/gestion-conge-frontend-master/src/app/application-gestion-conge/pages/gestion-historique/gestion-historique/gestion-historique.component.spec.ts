import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionHistoriqueComponent } from './gestion-historique.component';

describe('GestionHistoriqueComponent', () => {
  let component: GestionHistoriqueComponent;
  let fixture: ComponentFixture<GestionHistoriqueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GestionHistoriqueComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionHistoriqueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
