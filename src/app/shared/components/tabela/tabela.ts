import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  computed,
  contentChildren,
  ElementRef,
  input,
  linkedSignal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CelulaTabela, ContextoCelula } from './celula-tabela';
import { ColunaTabela } from './coluna-tabela';
import { PaginadorIntl } from './paginador-intl';

/**
 * Tabela genérica e reutilizável: funciona com linhas de qualquer tipo T.
 * Cuida da estrutura (HTML semântico, cabeçalho, estados de carregando e vazio
 * e o modo "cartão" no celular). O conteúdo de cada célula vem do `valor` da
 * coluna ou de um molde `<ng-template appCelula="chave">` passado por quem usa.
 */
@Component({
  imports: [NgTemplateOutlet, MatPaginatorModule],
  // Textos do paginador em português (aqui, e não na raiz: vão juntos no carregamento sob demanda)
  providers: [{ provide: MatPaginatorIntl, useClass: PaginadorIntl }],
  selector: 'app-tabela',
  styleUrl: './tabela.scss',
  templateUrl: './tabela.html',
})
export class Tabela<T> {
  /** Título da tabela (elemento `<caption>`). */
  readonly legenda = input.required<string>();
  readonly colunas = input.required<readonly ColunaTabela<T>[]>();
  readonly linhas = input.required<readonly T[]>();
  /** Identidade de cada linha, usada pelo `@for` e no atributo `data-id`. Padrão: o próprio objeto. */
  readonly rastrearPor = input<(linha: T) => unknown>((linha) => linha);
  readonly carregando = input(false);
  readonly textoCarregando = input('Carregando…');
  /** Aviso exibido sem linhas. `null`: nenhum aviso (ex.: quando quem usa já mostra um erro). */
  readonly textoVazio = input<string | null>('Nenhum registro encontrado.');
  /** Identidade (o mesmo valor do `rastrearPor`) da linha que entra com destaque animado. */
  readonly linhaNova = input<unknown>(null);
  /**
   * Paginação: aparece quando há mais linhas que este número (`null`: sem paginação).
   * É também o tamanho inicial da página; o usuário pode trocá-lo entre as opções.
   */
  readonly itensPorPagina = input<number | null>(null);
  readonly opcoesItensPorPagina = input<readonly number[]>([5, 10, 20]);

  /** Tamanho escolhido pelo usuário; volta ao padrão se `itensPorPagina` mudar. */
  protected readonly tamanhoPagina = linkedSignal(() => this.itensPorPagina() ?? 10);

  /**
   * Página pedida pelo usuário. Quando entra uma linha nova, vai para a página dela,
   * para o destaque animado ficar visível. (`untracked`: só a chegada de uma linha
   * nova reposiciona; mudanças na lista ou no tamanho não devem fazer a página pular.)
   */
  private readonly paginaPedida = linkedSignal({
    source: this.linhaNova,
    computation: (nova) => untracked(() => this.paginaDaLinha(nova)),
  });

  protected readonly paginar = computed(() => {
    const limite = this.itensPorPagina();
    return limite !== null && this.linhas().length > limite;
  });

  /** Página exibida: a pedida, limitada à última que existe (ex.: depois de remover linhas). */
  protected readonly paginaAtual = computed(() => {
    const ultima = Math.max(0, Math.ceil(this.linhas().length / this.tamanhoPagina()) - 1);
    return Math.min(this.paginaPedida(), ultima);
  });

  protected readonly linhasVisiveis = computed(() => {
    if (!this.paginar()) {
      return this.linhas();
    }
    const inicio = this.paginaAtual() * this.tamanhoPagina();
    return this.linhas().slice(inicio, inicio + this.tamanhoPagina());
  });

  /** Moldes de célula declarados por quem usa a tabela, indexados pela chave da coluna. */
  private readonly celulas = contentChildren<CelulaTabela<T>>(CelulaTabela);
  protected readonly moldes = computed(
    () =>
      new Map<string, TemplateRef<ContextoCelula<T>>>(
        this.celulas().map((celula) => [celula.chave(), celula.molde]),
      ),
  );

  private readonly elementoTabela = viewChild.required<ElementRef<HTMLElement>>('elementoTabela');

  /**
   * Leva o foco para a tabela (o leitor de tela anuncia o nome dela, vindo do caption).
   * Útil quando o elemento que tinha o foco deixa de existir (ex.: a última linha foi removida).
   */
  focar(): void {
    this.elementoTabela().nativeElement.focus();
  }

  /** O paginador avisa a página e o tamanho escolhidos (ao trocar o tamanho, ele recalcula a página). */
  protected mudarPagina(evento: PageEvent): void {
    this.tamanhoPagina.set(evento.pageSize);
    this.paginaPedida.set(evento.pageIndex);
  }

  /** Página em que está a linha com essa identidade (a primeira, se ela não estiver na lista). */
  private paginaDaLinha(identidade: unknown): number {
    const indice = this.linhas().findIndex((linha) => this.rastrearPor()(linha) === identidade);
    return indice < 0 ? 0 : Math.floor(indice / this.tamanhoPagina());
  }
}
