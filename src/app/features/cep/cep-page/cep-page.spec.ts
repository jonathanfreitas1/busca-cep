import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BuscaCep } from '../busca-cep/busca-cep';
import { ListaBuscas } from '../lista-buscas/lista-buscas';
import { Busca } from '../models/busca.model';
import { Endereco } from '../models/endereco.model';
import { BuscasStore } from '../services/buscas.store';
import { CepPage } from './cep-page';

/** Store falso: mesmos signals e métodos do BuscasStore, sem HTTP. */
class BuscasStoreFalso {
  readonly buscas = signal<readonly Busca[]>([]);
  readonly buscando = signal(false);
  readonly erroBusca = signal<string | null>(null);
  readonly carregandoHistorico = signal(false);
  readonly erroHistorico = signal<string | null>(null);
  readonly idBuscaNova = signal<string | null>(null);
  readonly carregar = vi.fn();
  readonly buscarCep = vi.fn();
  readonly remover = vi.fn();
}

const BUSCA = new Busca(
  'id-1',
  new Endereco({
    cep: '01001-000',
    logradouro: 'Praça da Sé',
    complemento: '',
    bairro: 'Sé',
    localidade: 'São Paulo',
    uf: 'SP',
  }),
  new Date(2026, 9, 16),
);

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
  const listaDeBuscas = () => fixture.debugElement.query(By.directive(ListaBuscas));

  it('deve exibir o título da página', () => {
    const titulo = fixture.nativeElement.querySelector('h1') as HTMLElement;

    expect(titulo.textContent).toContain('Busca de Endereços');
  });

  it('deve nomear cada seção com um h2 (h1 → h2, sem pular nível)', () => {
    const secoes = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('section'),
    );

    const nomes = secoes.map((secao) => {
      const titulo = secao.querySelector('h2');
      expect(secao.getAttribute('aria-labelledby')).toBe(titulo?.id);
      return titulo?.textContent?.trim();
    });

    expect(nomes).toEqual(['Buscar endereço', 'Histórico de buscas']);
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

  it('deve repassar à lista as buscas e o estado do histórico', async () => {
    store.buscas.set([BUSCA]);
    store.erroHistorico.set('Não foi possível acessar o histórico de buscas.');
    store.idBuscaNova.set(BUSCA.id);
    await fixture.whenStable();

    const lista = listaDeBuscas().componentInstance as ListaBuscas;
    expect(lista.buscas()).toEqual([BUSCA]);
    expect(lista.erro()).toBe('Não foi possível acessar o histórico de buscas.');
    expect(lista.idBuscaNova()).toBe(BUSCA.id);
  });

  it('deve repassar ao store a busca que a lista pediu para remover', () => {
    const lista = listaDeBuscas().componentInstance as ListaBuscas;

    lista.remover.emit(BUSCA);

    expect(store.remover).toHaveBeenCalledWith(BUSCA);
  });
});
