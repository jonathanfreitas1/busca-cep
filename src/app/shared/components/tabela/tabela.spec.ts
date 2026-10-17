import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatPaginatorHarness } from '@angular/material/paginator/testing';
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
      [textoVazio]="textoVazio()"
      [linhaNova]="linhaNova()"
      [itensPorPagina]="itensPorPagina()"
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
  readonly textoVazio = signal<string | null>('Nenhum carro cadastrado.');
  readonly linhaNova = signal<string | null>(null);
  readonly itensPorPagina = signal<number | null>(null);
  readonly porChassi = (carro: Carro): string => carro.chassi;
  readonly colunas: readonly ColunaTabela<Carro>[] = [
    { chave: 'modelo', titulo: 'Modelo', semQuebra: true, valor: (carro) => carro.modelo },
    { chave: 'cor', titulo: 'Cor' }, // molde
    { chave: 'acoes', titulo: 'Ações', tituloOculto: true, compacta: true },
  ];
}

describe('Tabela', () => {
  let fixture: ComponentFixture<Hospedeiro>;
  let elemento: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hospedeiro],
      // O seletor de tamanho do paginador abre um painel animado: no jsdom a animação
      // nunca termina, então as animações do Material ficam desligadas nos testes
      providers: [{ provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } }],
    }).compileComponents();

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

  it('deve marcar as colunas semQuebra no cabeçalho e nas células', () => {
    const marcadas = (seletor: string) =>
      Array.from(elemento.querySelectorAll(seletor)).map((el) =>
        el.classList.contains('tabela__celula--sem-quebra'),
      );

    expect(marcadas('th')).toEqual([true, false, false]);
    expect(marcadas('tbody tr:first-child td')).toEqual([true, false, false]);
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

  it('deve destacar só a linha indicada em linhaNova', async () => {
    const destacadas = () =>
      Array.from(elemento.querySelectorAll('.tabela__linha--nova')).map((tr) =>
        tr.getAttribute('data-id'),
      );
    expect(destacadas()).toEqual([]);

    fixture.componentInstance.linhaNova.set('9BHBG51CAKP654321');
    await fixture.whenStable();

    expect(destacadas()).toEqual(['9BHBG51CAKP654321']);
  });

  it('deve exibir o texto de vazio quando não houver linhas', async () => {
    fixture.componentInstance.carros.set([]);
    await fixture.whenStable();

    const aviso = elemento.querySelector('tbody td');
    expect(aviso?.textContent?.trim()).toBe('Nenhum carro cadastrado.');
    expect(aviso?.getAttribute('colspan')).toBe('3');
  });

  it('não deve exibir aviso de vazio quando textoVazio for null', async () => {
    fixture.componentInstance.carros.set([]);
    fixture.componentInstance.textoVazio.set(null);
    await fixture.whenStable();

    expect(elemento.querySelector('tbody tr')).toBeNull();
  });

  it('deve exibir o texto de carregando no lugar das linhas', async () => {
    fixture.componentInstance.carregando.set(true);
    await fixture.whenStable();

    expect(textos('tbody td')).toEqual(['Carregando…']);
  });

  it('deve permitir levar o foco para a tabela, sem filhos focáveis no caption', () => {
    const tabela = fixture.debugElement.query(By.directive(Tabela))
      .componentInstance as Tabela<Carro>;

    tabela.focar();

    expect(document.activeElement).toBe(elemento.querySelector('table'));
    expect(elemento.querySelector('caption')?.hasAttribute('tabindex')).toBe(false);
  });

  describe('paginação', () => {
    // n carros com chassi C1, C2, ... (na ordem)
    const frota = (n: number): Carro[] =>
      Array.from({ length: n }, (_, i) => ({
        chassi: `C${i + 1}`,
        modelo: `Carro ${i + 1}`,
        cor: '-',
      }));
    const idsNaTela = () =>
      Array.from(elemento.querySelectorAll('tbody tr[data-id]')).map((tr) =>
        tr.getAttribute('data-id'),
      );
    const paginador = () =>
      TestbedHarnessEnvironment.loader(fixture).getHarness(MatPaginatorHarness);

    async function exibir(carros: Carro[], itensPorPagina = 10): Promise<void> {
      fixture.componentInstance.itensPorPagina.set(itensPorPagina);
      fixture.componentInstance.carros.set(carros);
      await fixture.whenStable();
    }

    it('não deve paginar quando as linhas cabem no limite', async () => {
      await exibir(frota(10));

      expect(idsNaTela()).toHaveLength(10);
      expect(elemento.querySelector('mat-paginator')).toBeNull();
    });

    it('deve mostrar só a primeira página e o paginador acima do limite', async () => {
      await exibir(frota(12));

      expect(idsNaTela()).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10']);
      expect(await (await paginador()).getRangeLabel()).toBe('1 – 10 de 12');
    });

    it('deve avançar para a próxima página', async () => {
      await exibir(frota(12));

      await (await paginador()).goToNextPage();

      expect(idsNaTela()).toEqual(['C11', 'C12']);
      expect(await (await paginador()).getRangeLabel()).toBe('11 – 12 de 12');
    });

    it('deve trocar o tamanho da página, mantendo o paginador visível', async () => {
      await exibir(frota(12));

      await (await paginador()).setPageSize(20);

      expect(idsNaTela()).toHaveLength(12);
      expect(await (await paginador()).getRangeLabel()).toBe('1 – 12 de 12');
    });

    it('deve mostrar a última página que existe quando linhas saem da lista', async () => {
      await exibir(frota(25));
      await (await paginador()).goToLastPage(); // C21 a C25

      await exibir(frota(20));

      expect(idsNaTela()[0]).toBe('C11');
      expect(await (await paginador()).getRangeLabel()).toBe('11 – 20 de 20');
    });

    it('não deve mudar de página quando a lista muda sem uma linha nova', async () => {
      await exibir(frota(25));
      await (await paginador()).goToNextPage(); // C11 a C20

      await exibir(frota(25).filter((carro) => carro.chassi !== 'C1'));

      expect(idsNaTela()[0]).toBe('C12'); // continua na 2ª página
    });

    it('deve ir para a página da linha nova', async () => {
      await exibir(frota(15));

      fixture.componentInstance.linhaNova.set('C13');
      await fixture.whenStable();

      expect(idsNaTela()).toContain('C13');
      expect(elemento.querySelector('.tabela__linha--nova')?.getAttribute('data-id')).toBe('C13');
    });
  });
});
