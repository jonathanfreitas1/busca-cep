import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, contentChildren, input, TemplateRef } from '@angular/core';
import { CelulaTabela, ContextoCelula } from './celula-tabela';
import { ColunaTabela } from './coluna-tabela';

/**
 * Tabela genérica e reutilizável: funciona com linhas de qualquer tipo T.
 * Cuida da estrutura (HTML semântico, cabeçalho, estados de carregando e vazio
 * e o modo "cartão" no celular). O conteúdo de cada célula vem do `valor` da
 * coluna ou de um molde `<ng-template appCelula="chave">` passado por quem usa.
 */
@Component({
  imports: [NgTemplateOutlet],
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
  readonly textoVazio = input('Nenhum registro encontrado.');

  /** Moldes de célula declarados por quem usa a tabela, indexados pela chave da coluna. */
  private readonly celulas = contentChildren<CelulaTabela<T>>(CelulaTabela);
  protected readonly moldes = computed(
    () =>
      new Map<string, TemplateRef<ContextoCelula<T>>>(
        this.celulas().map((celula) => [celula.chave(), celula.molde]),
      ),
  );
}
