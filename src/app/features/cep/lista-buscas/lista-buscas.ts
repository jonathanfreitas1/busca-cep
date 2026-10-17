import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CelulaTabela } from '../../../shared/components/tabela/celula-tabela';
import { ColunaTabela } from '../../../shared/components/tabela/coluna-tabela';
import { Tabela } from '../../../shared/components/tabela/tabela';
import { Busca } from '../models/busca.model';

/**
 * Listagem das buscas realizadas (componente apresentacional):
 * monta a Tabela genérica com as colunas de busca e emite o pedido de remoção.
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
  /** Emitido com a busca que o usuário pediu para remover. */
  readonly remover = output<Busca>();

  protected readonly colunas: readonly ColunaTabela<Busca>[] = [
    { chave: 'cep', titulo: 'CEP', valor: (busca) => busca.cep },
    { chave: 'endereco', titulo: 'Endereço', valor: (busca) => busca.endereco.descricao },
    { chave: 'data', titulo: 'Data' }, // molde: precisa da tag <time>
    { chave: 'acoes', titulo: 'Ações', tituloOculto: true, compacta: true }, // molde: botão
  ];

  protected readonly idDaBusca = (busca: Busca): string => busca.id;
}
