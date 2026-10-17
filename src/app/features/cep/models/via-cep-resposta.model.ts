/**
 * Formato cru retornado pelo ViaCEP para um CEP encontrado.
 * https://viacep.com.br/ws/01001000/json/
 */
export interface ViaCepResposta {
  readonly cep: string;
  readonly logradouro: string;
  readonly complemento: string;
  readonly unidade: string;
  readonly bairro: string;
  readonly localidade: string;
  readonly uf: string;
  readonly estado: string;
  readonly regiao: string;
  readonly ibge: string;
  readonly gia: string;
  readonly ddd: string;
  readonly siafi: string;
}

/**
 * Resposta do ViaCEP para um CEP com formato válido, mas inexistente.
 * Hoje a API envia o texto "true"; versões antigas enviavam o booleano true.
 */
export interface ViaCepErro {
  readonly erro: 'true' | true;
}
