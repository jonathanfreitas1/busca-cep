import { DatePipe } from '@angular/common';
import {
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs';
import { CelulaTabela } from '../../../shared/components/tabela/celula-tabela';
import { ColunaTabela } from '../../../shared/components/tabela/coluna-tabela';
import { Tabela } from '../../../shared/components/tabela/tabela';
import { ConfirmacaoService } from '../../../shared/services/confirmacao.service';
import { Busca } from '../models/busca.model';

/** Remoção confirmada que ainda não saiu da tela, e quem recebe o foco depois. */
interface RemocaoPendente {
  readonly idRemovida: string;
  readonly idProximoFoco: string | null;
}

/**
 * Listagem das buscas realizadas (componente apresentacional):
 * monta a Tabela genérica com as colunas de busca, pede confirmação
 * e emite o pedido de remoção.
 */
@Component({
  imports: [Tabela, CelulaTabela, DatePipe, MatButtonModule, MatIconModule],
  selector: 'app-lista-buscas',
  styleUrl: './lista-buscas.scss',
  templateUrl: './lista-buscas.html',
})
export class ListaBuscas {
  readonly buscas = input.required<readonly Busca[]>();
  readonly carregando = input(false);
  /** Mensagem de erro do histórico (ex.: API indisponível). */
  readonly erro = input<string | null>(null);
  /** Id da busca recém-salva, que entra na tabela com destaque. */
  readonly idBuscaNova = input<string | null>(null);
  /** Emitido com a busca que o usuário confirmou que quer remover. */
  readonly remover = output<Busca>();

  /** Sem aviso de vazio quando há erro: a lista não está vazia, está indisponível. */
  protected readonly textoVazio = computed(() =>
    this.erro() ? null : 'Nenhuma busca realizada ainda.',
  );

  protected readonly colunas: readonly ColunaTabela<Busca>[] = [
    { chave: 'cep', titulo: 'CEP', valor: (busca) => busca.cep },
    { chave: 'endereco', titulo: 'Endereço', valor: (busca) => busca.endereco.descricao },
    { chave: 'data', titulo: 'Data' }, // molde: precisa da tag <time>
    { chave: 'acoes', titulo: 'Ações', tituloOculto: true, compacta: true }, // molde: botão
  ];

  protected readonly idDaBusca = (busca: Busca): string => busca.id;

  private readonly confirmacao = inject(ConfirmacaoService);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly tabela = viewChild.required(Tabela);
  private remocaoPendente: RemocaoPendente | null = null;

  constructor() {
    // Quando a linha removida sai da tela, o botão que tinha o foco deixa de existir
    // e o foco cairia no início da página. Leva o foco para a linha vizinha.
    afterRenderEffect(() => {
      const idsNaTela = this.buscas().map((busca) => busca.id);
      const pendente = this.remocaoPendente;

      if (pendente && !idsNaTela.includes(pendente.idRemovida)) {
        this.remocaoPendente = null;
        this.focarAposRemocao(pendente.idProximoFoco);
      }
    });
  }

  protected pedirRemocao(busca: Busca): void {
    this.confirmacao
      .confirmar({
        titulo: 'Remover busca',
        mensagem: `Remover a busca do CEP ${busca.cep} (${busca.endereco.descricao}) do histórico?`,
        textoConfirmar: 'Remover',
      })
      .pipe(filter((confirmou) => confirmou))
      .subscribe(() => {
        this.remocaoPendente = { idRemovida: busca.id, idProximoFoco: this.vizinhaDe(busca) };
        this.remover.emit(busca);
      });
  }

  /** A busca seguinte ou, se esta for a última, a anterior (null se for a única). */
  private vizinhaDe(busca: Busca): string | null {
    const lista = this.buscas();
    const indice = lista.findIndex((item) => item.id === busca.id);

    return (lista[indice + 1] ?? lista[indice - 1])?.id ?? null;
  }

  private focarAposRemocao(idBusca: string | null): void {
    const linha = Array.from(
      this.elemento.nativeElement.querySelectorAll<HTMLElement>('tr[data-id]'),
    ).find((tr) => tr.dataset['id'] === idBusca);
    const botao = linha?.querySelector<HTMLButtonElement>('.lista-buscas__remover');

    if (botao) {
      botao.focus();
    } else {
      this.tabela().focarLegenda(); // a tabela ficou vazia
    }
  }
}
