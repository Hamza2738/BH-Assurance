import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionDemandeComponent } from './gestion-demande.component';

describe('GestionDemandeComponent', () => {
  let component: GestionDemandeComponent;
  let fixture: ComponentFixture<GestionDemandeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GestionDemandeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionDemandeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
