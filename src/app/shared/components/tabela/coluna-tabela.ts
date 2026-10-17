/** Definição de uma coluna da Tabela, para linhas do tipo T. */
export interface ColunaTabela<T> {
  /** Identificador da coluna; liga a coluna a um molde `<ng-template appCelula="chave">`. */
  readonly chave: string;
  /** Título do cabeçalho (e rótulo da célula no modo cartão, no celular). */
  readonly titulo: string;
  /** Título só para leitores de tela (ex.: coluna de ações). */
  readonly tituloOculto?: boolean;
  /** Coluna estreita, alinhada à direita (ex.: botões de ação). */
  readonly compacta?: boolean;
  /** Conteúdo curto que não deve quebrar linha no modo tabela (ex.: CEP, data). */
  readonly semQuebra?: boolean;
  /** Texto da célula, usado quando a coluna não tem molde. */
  readonly valor?: (linha: T) => string;
}
