import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjoutUtilisateutComponent } from './ajout-utilisateut.component';

describe('AjoutUtilisateutComponent', () => {
  let component: AjoutUtilisateutComponent;
  let fixture: ComponentFixture<AjoutUtilisateutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AjoutUtilisateutComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AjoutUtilisateutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
