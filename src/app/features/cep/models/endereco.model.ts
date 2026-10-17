/** Dados necessários para criar um Endereco. */
export interface DadosEndereco {
  readonly cep: string;
  readonly logradouro: string;
  readonly complemento: string;
  readonly bairro: string;
  readonly localidade: string;
  readonly uf: string;
}

/** Endereço do domínio da aplicação, independente do formato de qualquer API. */
export class Endereco implements DadosEndereco {
  readonly cep: string;
  readonly logradouro: string;
  readonly complemento: string;
  readonly bairro: string;
  readonly localidade: string;
  readonly uf: string;

  constructor(dados: DadosEndereco) {
    this.cep = dados.cep;
    this.logradouro = dados.logradouro;
    this.complemento = dados.complemento;
    this.bairro = dados.bairro;
    this.localidade = dados.localidade;
    this.uf = dados.uf;
  }

  /**
   * Texto para exibição: "Logradouro, Bairro - Cidade/UF", omitindo as partes vazias.
   * CEPs de cidade inteira não têm logradouro nem bairro: nesse caso, só "Cidade/UF".
   */
  get descricao(): string {
    const local = [this.logradouro, this.bairro].filter((parte) => parte.trim() !== '').join(', ');
    const cidade = `${this.localidade}/${this.uf}`;

    return local ? `${local} - ${cidade}` : cidade;
  }
}
