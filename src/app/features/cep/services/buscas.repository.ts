import { Observable } from 'rxjs';
import { Busca } from '../models/busca.model';

/**
 * Contrato do histórico de buscas: o resto da aplicação depende só desta classe,
 * não de onde os dados são guardados (json-server, localStorage...).
 *
 * É uma classe abstrata, e não uma interface, porque também serve de "chave" na
 * injeção de dependência: interfaces do TypeScript não existem em tempo de execução.
 */
export abstract class BuscasRepository {
  /** Lista as buscas salvas, sem ordem garantida. */
  abstract listar(): Observable<Busca[]>;

  /**
   * Salva uma busca e devolve a busca como ficou salva.
   * O id devolvido é o definitivo: a implementação pode trocar o id original.
   */
  abstract salvar(busca: Busca): Observable<Busca>;

  /** Remove uma busca do histórico. */
  abstract remover(busca: Busca): Observable<void>;
}
