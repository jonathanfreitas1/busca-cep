import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BuscaCep } from '../busca-cep/busca-cep';
import { Busca } from '../models/busca.model';
import { BuscasStore } from '../services/buscas.store';
import { CepPage } from './cep-page';

/** Store falso: mesmos signals e métodos do BuscasStore, sem HTTP. */
class BuscasStoreFalso {
  readonly buscas = signal<readonly Busca[]>([]);
  readonly buscando = signal(false);
  readonly erroBusca = signal<string | null>(null);
  readonly carregandoHistorico = signal(false);
  readonly erroHistorico = signal<string | null>(null);
  readonly carregar = vi.fn();
  readonly buscarCep = vi.fn();
  readonly remover = vi.fn();
}

describe('CepPage', () => {
  let fixture: ComponentFixture<CepPage>;
  let store: BuscasStoreFalso;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CepPage],
      providers: [{ provide: BuscasStore, useClass: BuscasStoreFalso }],
    }).compileComponents();

    store = TestBed.inject(BuscasStore) as unknown as BuscasStoreFalso;
    fixture = TestBed.createComponent(CepPage);
    await fixture.whenStable();
  });

  const formulario = () => fixture.debugElement.query(By.directive(BuscaCep));

  it('deve exibir o título da página', () => {
    const titulo = fixture.nativeElement.querySelector('h1') as HTMLElement;

    expect(titulo.textContent).toContain('Busca de Endereços');
  });

  it('deve carregar o histórico ao abrir a página', () => {
    expect(store.carregar).toHaveBeenCalledTimes(1);
  });

  it('deve repassar ao store o CEP pedido pelo formulário', () => {
    const buscaCep = formulario().componentInstance as BuscaCep;

    buscaCep.buscar.emit('01001-000');

    expect(store.buscarCep).toHaveBeenCalledWith('01001-000');
  });

  it('deve repassar ao formulário o estado da busca', async () => {
    store.buscando.set(true);
    store.erroBusca.set('CEP não encontrado.');
    await fixture.whenStable();

    const buscaCep = formulario().componentInstance as BuscaCep;
    expect(buscaCep.buscando()).toBe(true);
    expect(buscaCep.erro()).toBe('CEP não encontrado.');
  });
});
