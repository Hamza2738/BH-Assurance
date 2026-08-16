import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjoutUtilisateurComponent } from './ajout-utilisateur.component';

describe('AjoutUtilisateurComponent', () => {
  let component: AjoutUtilisateurComponent;
  let fixture: ComponentFixture<AjoutUtilisateurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AjoutUtilisateurComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AjoutUtilisateurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
