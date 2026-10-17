import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CelulaTabela } from './celula-tabela';
import { ColunaTabela } from './coluna-tabela';
import { Tabela } from './tabela';
import { By } from '@angular/platform-browser';

// A Tabela é genérica: o teste usa um tipo que não tem nada a ver com CEP
interface Carro {
  readonly chassi: string;
  readonly modelo: string;
  readonly cor: string;
}

const CARROS: readonly Carro[] = [
  { chassi: '9BGKS48U0LG123456', modelo: 'Onix', cor: 'Prata' },
  { chassi: '9BHBG51CAKP654321', modelo: 'HB20', cor: 'Branco' },
];

@Component({
  imports: [Tabela, CelulaTabela],
  template: `
    <app-tabela
      legenda="Carros cadastrados"
      [colunas]="colunas"
      [linhas]="carros()"
      [rastrearPor]="porChassi"
      [carregando]="carregando()"
      textoVazio="Nenhum carro cadastrado."
    >
      <ng-template appCelula="cor" [appCelulaDe]="carros()" let-carro>
        <strong>{{ carro.cor }}</strong>
      </ng-template>
    </app-tabela>
  `,
})
class Hospedeiro {
  readonly carros = signal<readonly Carro[]>(CARROS);
  readonly carregando = signal(false);
  readonly porChassi = (carro: Carro): string => carro.chassi;
  readonly colunas: readonly ColunaTabela<Carro>[] = [
    { chave: 'modelo', titulo: 'Modelo', valor: (carro) => carro.modelo },
    { chave: 'cor', titulo: 'Cor' }, // molde
    { chave: 'acoes', titulo: 'Ações', tituloOculto: true, compacta: true },
  ];
}

describe('Tabela', () => {
  let fixture: ComponentFixture<Hospedeiro>;
  let elemento: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Hospedeiro] }).compileComponents();

    fixture = TestBed.createComponent(Hospedeiro);
    elemento = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  const textos = (seletor: string) =>
    Array.from(elemento.querySelectorAll(seletor)).map((el) => el.textContent?.trim());

  it('deve exibir a legenda e os títulos das colunas', () => {
    expect(elemento.querySelector('caption')?.textContent).toContain('Carros cadastrados');
    expect(textos('th[scope="col"]')).toEqual(['Modelo', 'Cor', 'Ações']);
  });

  it('deve exibir uma linha por item, identificada pelo rastrearPor', () => {
    const linhas = elemento.querySelectorAll('tbody tr');

    expect(linhas).toHaveLength(2);
    expect(linhas[0].getAttribute('data-id')).toBe('9BGKS48U0LG123456');
  });

  it('deve usar o "valor" da coluna quando não houver molde', () => {
    expect(textos('tbody tr:first-child td:first-child')).toEqual(['Onix']);
  });

  it('deve usar o molde quando houver um para a coluna', () => {
    const celulaCor = elemento.querySelector('tbody tr:first-child td:nth-child(2)');

    expect(celulaCor?.querySelector('strong')?.textContent).toBe('Prata');
  });

  it('deve marcar cada célula com o rótulo da coluna (modo cartão)', () => {
    const celulas = elemento.querySelectorAll('tbody tr:first-child td');

    expect(celulas[0].getAttribute('data-label')).toBe('Modelo');
    expect(celulas[2].hasAttribute('data-label')).toBe(false); // título oculto: sem rótulo
  });

  it('deve deixar o título oculto disponível só para leitores de tela', () => {
    const tituloAcoes = elemento.querySelectorAll('th')[2];

    expect(tituloAcoes.classList).toContain('visualmente-oculto');
  });

  it('deve declarar os papéis de tabela explicitamente', () => {
    expect(elemento.querySelector('table')?.getAttribute('role')).toBe('table');
    expect(elemento.querySelector('tbody tr')?.getAttribute('role')).toBe('row');
    expect(elemento.querySelector('tbody td')?.getAttribute('role')).toBe('cell');
  });

  it('deve exibir o texto de vazio quando não houver linhas', async () => {
    fixture.componentInstance.carros.set([]);
    await fixture.whenStable();

    const aviso = elemento.querySelector('tbody td');
    expect(aviso?.textContent?.trim()).toBe('Nenhum carro cadastrado.');
    expect(aviso?.getAttribute('colspan')).toBe('3');
  });

  it('deve exibir o texto de carregando no lugar das linhas', async () => {
    fixture.componentInstance.carregando.set(true);
    await fixture.whenStable();

    expect(textos('tbody td')).toEqual(['Carregando…']);
  });

  it('deve permitir levar o foco para a legenda', () => {
    const tabela = fixture.debugElement.query(By.directive(Tabela))
      .componentInstance as Tabela<Carro>;

    tabela.focarLegenda();

    expect(document.activeElement).toBe(elemento.querySelector('caption'));
  });
});
