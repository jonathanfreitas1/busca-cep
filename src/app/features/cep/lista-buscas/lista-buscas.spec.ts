import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import type { Mock } from 'vitest';
import { DadosConfirmacao } from '../../../shared/components/dialogo-confirmacao/dialogo-confirmacao';
import { ConfirmacaoService } from '../../../shared/services/confirmacao.service';
import { Busca } from '../models/busca.model';
import { Endereco } from '../models/endereco.model';
import { ListaBuscas } from './lista-buscas';

function criarBusca(id: string, cep: string, logradouro: string): Busca {
  return new Busca(
    id,
    new Endereco({
      cep,
      logradouro,
      complemento: '',
      bairro: 'Sé',
      localidade: 'São Paulo',
      uf: 'SP',
    }),
    new Date(2026, 9, 16, 18, 22), // 16/10/2026 18:22 (hora local)
  );
}

const BUSCA_SE = criarBusca('id-1', '01001-000', 'Praça da Sé');
const BUSCA_2 = criarBusca('id-2', '01002-000', 'Rua Direita');
const BUSCA_3 = criarBusca('id-3', '01003-000', 'Rua Quinze de Novembro');

describe('ListaBuscas', () => {
  let fixture: ComponentFixture<ListaBuscas>;
  let elemento: HTMLElement;
  let confirmar: Mock<(dados: DadosConfirmacao) => ReturnType<ConfirmacaoService['confirmar']>>;
  let emitidas: Busca[];

  beforeEach(async () => {
    // Serviço falso: responde "confirmou" sem abrir diálogo nenhum
    confirmar = vi.fn(() => of(true));

    await TestBed.configureTestingModule({
      imports: [ListaBuscas],
      providers: [{ provide: ConfirmacaoService, useValue: { confirmar } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaBuscas);
    fixture.componentRef.setInput('buscas', [BUSCA_SE]);
    elemento = fixture.nativeElement as HTMLElement;
    emitidas = [];
    fixture.componentInstance.remover.subscribe((busca) => emitidas.push(busca));
    await fixture.whenStable();
  });

  const celulas = () =>
    Array.from(elemento.querySelectorAll('tbody tr:first-child td')).map((td) =>
      td.textContent?.trim(),
    );
  const botaoRemover = (cep: string) =>
    elemento.querySelector<HTMLButtonElement>(`button[data-cep="${cep}"]`);

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
    const botao = botaoRemover('01001-000');

    expect(botao?.getAttribute('aria-label')).toBe('Remover busca do CEP 01001-000');
  });

  it('deve exibir o texto de vazio quando não houver buscas', async () => {
    fixture.componentRef.setInput('buscas', []);
    await fixture.whenStable();

    expect(celulas()).toEqual(['Nenhuma busca realizada ainda.']);
  });

  it('não deve exibir o texto de vazio quando houver erro no histórico', async () => {
    fixture.componentRef.setInput('buscas', []);
    fixture.componentRef.setInput('erro', 'Não foi possível acessar o histórico de buscas.');
    await fixture.whenStable();

    expect(celulas()).toEqual([]);
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

  describe('remover', () => {
    it('deve pedir confirmação informando o CEP e o endereço', () => {
      botaoRemover('01001-000')?.click();

      expect(confirmar).toHaveBeenCalledWith({
        titulo: 'Remover busca',
        mensagem: 'Remover a busca do CEP 01001-000 (Praça da Sé, Sé - São Paulo/SP) do histórico?',
        textoConfirmar: 'Remover',
      });
    });

    it('deve emitir a busca quando o usuário confirmar', () => {
      botaoRemover('01001-000')?.click();

      expect(emitidas).toEqual([BUSCA_SE]);
    });

    it('não deve emitir quando o usuário desistir', () => {
      confirmar.mockReturnValue(of(false));

      botaoRemover('01001-000')?.click();

      expect(emitidas).toEqual([]);
    });
  });

  describe('foco depois de remover', () => {
    // Simula o container: depois de confirmar, a busca sai da lista recebida
    async function removerESumir(remover: Busca, lista: readonly Busca[]): Promise<void> {
      fixture.componentRef.setInput('buscas', lista);
      await fixture.whenStable();

      botaoRemover(remover.cep)?.click();
      fixture.componentRef.setInput(
        'buscas',
        lista.filter((busca) => busca !== remover),
      );
      await fixture.whenStable();
    }

    it('deve ir para o botão da linha seguinte', async () => {
      await removerESumir(BUSCA_2, [BUSCA_SE, BUSCA_2, BUSCA_3]);

      expect(document.activeElement).toBe(botaoRemover('01003-000'));
    });

    it('deve ir para o botão da linha anterior quando a removida era a última', async () => {
      await removerESumir(BUSCA_3, [BUSCA_SE, BUSCA_2, BUSCA_3]);

      expect(document.activeElement).toBe(botaoRemover('01002-000'));
    });

    it('deve ir para o título da tabela quando ela ficar vazia', async () => {
      await removerESumir(BUSCA_SE, [BUSCA_SE]);

      expect(document.activeElement).toBe(elemento.querySelector('caption'));
    });
  });
});
