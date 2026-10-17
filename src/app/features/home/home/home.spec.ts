import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let elemento: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    elemento = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('deve exibir o título de boas-vindas', () => {
    const titulo = elemento.querySelector('h1');

    expect(titulo?.textContent).toContain('Bem-vindo/a ao teste de front-end');
  });

  it('deve exibir o autor e a data do teste', () => {
    const autoria = elemento.querySelector('.boas-vindas__autoria');
    const data = autoria?.querySelector('time');

    expect(autoria?.textContent).toContain('Jonathan');
    expect(data?.getAttribute('datetime')).toBe('2026-10-18');
    expect(data?.textContent).toBe('18/10/2026');
  });

  it('deve ter um link para a busca de endereços', () => {
    const link = elemento.querySelector<HTMLAnchorElement>('a.boas-vindas__acao');

    expect(link?.getAttribute('href')).toBe('/enderecos');
    expect(link?.textContent).toContain('Buscar endereços');
  });
});
