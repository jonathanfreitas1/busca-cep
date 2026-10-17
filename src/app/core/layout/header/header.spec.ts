import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { provideRouter, Router } from '@angular/router';
import { Header } from './header';

// Componente vazio só para as rotas de teste terem o que exibir
@Component({ template: '' })
class PaginaFalsa {}

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let elemento: HTMLElement;
  let router: Router;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([
          { path: '', component: PaginaFalsa },
          { path: 'enderecos', component: PaginaFalsa },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    elemento = fixture.nativeElement as HTMLElement;
    router = TestBed.inject(Router);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  });

  async function navegarPara(url: string): Promise<void> {
    await router.navigateByUrl(url);
    await fixture.whenStable();
  }

  it('deve exibir o logo com texto alternativo e link para a página inicial', () => {
    const link = elemento.querySelector<HTMLAnchorElement>('a.header__marca');

    expect(link?.getAttribute('href')).toBe('/');
    expect(link?.getAttribute('aria-label')).toBe('Busca CEP: ir para a página inicial');
    expect(link?.querySelector('img')?.getAttribute('alt')).toBe('SCCON');
  });

  it('deve exibir o menu principal com Home e Endereços', () => {
    const menu = elemento.querySelector('nav[aria-label="Menu principal"]');

    expect(menu?.textContent).toContain('Home');
    expect(menu?.textContent).toContain('Endereços');
  });

  it('deve destacar Home na página inicial', async () => {
    await navegarPara('/');
    const home = elemento.querySelector('a.header__link');

    expect(home?.classList).toContain('header__link--ativo');
    expect(home?.getAttribute('aria-current')).toBe('page');
  });

  it('deve destacar Endereços (e não Home) em /enderecos', async () => {
    await navegarPara('/enderecos');
    const home = elemento.querySelector('a.header__link');
    const enderecos = elemento.querySelector('button.header__link');

    expect(enderecos?.classList).toContain('header__link--ativo');
    expect(home?.classList).not.toContain('header__link--ativo');
  });

  it('deve navegar para /enderecos pelo submenu "Buscar Endereços"', async () => {
    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: /Endereços/ }));

    await menu.open();
    await menu.clickItem({ text: 'Buscar Endereços' });
    await fixture.whenStable();

    expect(router.url).toBe('/enderecos');
  });
});
