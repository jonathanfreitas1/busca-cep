import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Busca } from '../models/busca.model';
import { Endereco } from '../models/endereco.model';
import { ListaBuscas } from './lista-buscas';

const BUSCA_SE = new Busca(
  'id-1',
  new Endereco({
    cep: '01001-000',
    logradouro: 'Praça da Sé',
    complemento: 'lado ímpar',
    bairro: 'Sé',
    localidade: 'São Paulo',
    uf: 'SP',
  }),
  new Date(2026, 9, 16, 18, 22), // 16/10/2026 18:22 (hora local)
);

describe('ListaBuscas', () => {
  let fixture: ComponentFixture<ListaBuscas>;
  let elemento: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ListaBuscas] }).compileComponents();

    fixture = TestBed.createComponent(ListaBuscas);
    fixture.componentRef.setInput('buscas', [BUSCA_SE]);
    elemento = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  const celulas = () =>
    Array.from(elemento.querySelectorAll('tbody tr:first-child td')).map((td) =>
      td.textContent?.trim(),
    );

  it('deve exibir CEP, endereço e data no formato do wireframe', () => {
    const [cep, endereco, data] = celulas();

    expect(cep).toBe('01001-000');
    expect(endereco).toBe('Praça da Sé, Sé - São Paulo/SP');
    expect(data).toBe('16/10/2026 - 18:22');
  });

  it('deve marcar a data com a tag <time> e o valor em formato ISO', () => {
    const tempo = elemento.querySelector('time');

    expect(tempo?.getAttribute('datetime')).toBe(BUSCA_SE.dataHora.toISOString());
  });

  it('deve ter um botão de remover com nome acessível e o CEP em data-cep', () => {
    const botao = elemento.querySelector('button.lista-buscas__remover');

    expect(botao?.getAttribute('aria-label')).toBe('Remover busca do CEP 01001-000');
    expect(botao?.getAttribute('data-cep')).toBe('01001-000');
  });

  it('deve emitir a busca ao clicar em remover', () => {
    const emitidas: Busca[] = [];
    fixture.componentInstance.remover.subscribe((busca) => emitidas.push(busca));

    elemento.querySelector<HTMLButtonElement>('button.lista-buscas__remover')?.click();

    expect(emitidas).toEqual([BUSCA_SE]);
  });

  it('deve exibir o texto de vazio quando não houver buscas', async () => {
    fixture.componentRef.setInput('buscas', []);
    await fixture.whenStable();

    expect(celulas()).toEqual(['Nenhuma busca realizada ainda.']);
  });

  it('deve exibir o texto de carregando', async () => {
    fixture.componentRef.setInput('carregando', true);
    await fixture.whenStable();

    expect(celulas()).toEqual(['Carregando histórico…']);
  });

  it('deve exibir a mensagem de erro numa região de alerta', async () => {
    fixture.componentRef.setInput('erro', 'Não foi possível acessar o histórico de buscas.');
    await fixture.whenStable();

    const alerta = elemento.querySelector('[role="alert"]');
    expect(alerta?.textContent).toContain('Não foi possível acessar o histórico de buscas.');
  });
});
