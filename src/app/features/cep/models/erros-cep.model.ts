/** O CEP informado não tem 8 dígitos (ou o ViaCEP o rejeitou como inválido). */
export class CepInvalidoError extends Error {
  constructor(readonly cep: string) {
    super(`CEP com formato inválido: "${cep}"`);
    this.name = 'CepInvalidoError';
  }
}

/** O CEP tem formato válido, mas não existe na base do ViaCEP. */
export class CepNaoEncontradoError extends Error {
  constructor(readonly cep: string) {
    super(`CEP não encontrado: ${cep}`);
    this.name = 'CepNaoEncontradoError';
  }
}

/** Não foi possível consultar o ViaCEP (sem conexão, tempo esgotado ou erro no servidor). */
export class ViaCepIndisponivelError extends Error {
  constructor(causa?: unknown) {
    super('Serviço do ViaCEP indisponível', { cause: causa });
    this.name = 'ViaCepIndisponivelError';
  }
}
