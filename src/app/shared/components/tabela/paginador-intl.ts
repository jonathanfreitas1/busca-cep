import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

/**
 * Textos do MatPaginator em português: rótulos visíveis e os nomes acessíveis
 * dos botões (lidos pelo leitor de tela).
 */
@Injectable()
export class PaginadorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Itens por página:';
  override firstPageLabel = 'Primeira página';
  override previousPageLabel = 'Página anterior';
  override nextPageLabel = 'Próxima página';
  override lastPageLabel = 'Última página';

  /** Ex.: "11 – 20 de 23". */
  override getRangeLabel = (pagina: number, tamanho: number, total: number): string => {
    if (total === 0) {
      return `0 de ${total}`;
    }
    const inicio = pagina * tamanho;
    const fim = Math.min(inicio + tamanho, total);
    return `${inicio + 1} – ${fim} de ${total}`;
  };
}
