import { Endereco } from './endereco.model';

/** Uma busca de CEP realizada pelo usuário, guardada no histórico. */
export class Busca {
  constructor(
    readonly id: string,
    readonly endereco: Endereco,
    readonly dataHora: Date,
  ) {}

  /** CEP buscado, no formato 00000-000. */
  get cep(): string {
    return this.endereco.cep;
  }

  /**
   * Cria uma nova busca com identificador único gerado no navegador.
   * A data é informada por quem chama, para os testes serem previsíveis.
   */
  static criar(endereco: Endereco, dataHora: Date): Busca {
    return new Busca(crypto.randomUUID(), endereco, dataHora);
  }
}
