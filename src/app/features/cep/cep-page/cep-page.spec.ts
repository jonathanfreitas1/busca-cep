import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CepPage } from './cep-page';

describe('CepPage', () => {
  let component: CepPage;
  let fixture: ComponentFixture<CepPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CepPage],
    }).compileComponents();

    fixture = TestBed.createComponent(CepPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
