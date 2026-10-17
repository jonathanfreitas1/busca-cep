import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { catchError, map, Observable, throwError, timeout } from 'rxjs';
import { Endereco } from '../models/endereco.model';
import {
  CepInvalidoError,
  CepNaoEncontradoError,
  ViaCepIndisponivelError,
} from '../models/erros-cep.model';
import { ViaCepErro, ViaCepResposta } from '../models/via-cep-resposta.model';

const VIA_CEP_URL = 'https://viacep.com.br/ws';
const TEMPO_LIMITE_MS = 10_000;

/** Consulta endereços no ViaCEP e os converte para o domínio da aplicação. */
@Service()
export class ViaCepService {
  private readonly http = inject(HttpClient);

  /**
   * Busca o endereço de um CEP, com ou sem máscara.
   * Erros possíveis: CepInvalidoError, CepNaoEncontradoError, ViaCepIndisponivelError.
   */
  buscar(cep: string): Observable<Endereco> {
    const digitos = cep.replace(/\D/g, '');

    // Defesa em profundidade: nem chega a fazer a requisição com CEP inválido
    if (digitos.length !== 8) {
      return throwError(() => new CepInvalidoError(cep));
    }

    return this.http.get<ViaCepResposta | ViaCepErro>(`${VIA_CEP_URL}/${digitos}/json/`).pipe(
      timeout(TEMPO_LIMITE_MS),
      map((resposta) => {
        // CEP inexistente: o ViaCEP responde 200 com { "erro": "true" }
        if ('erro' in resposta) {
          throw new CepNaoEncontradoError(cep);
        }
        return this.paraEndereco(resposta);
      }),
      catchError((erro: unknown) => throwError(() => this.traduzirErro(erro, cep))),
    );
  }

  /** Converte o formato do ViaCEP para o model do domínio. */
  private paraEndereco(resposta: ViaCepResposta): Endereco {
    return new Endereco({
      cep: resposta.cep,
      logradouro: resposta.logradouro,
      complemento: resposta.complemento,
      bairro: resposta.bairro,
      localidade: resposta.localidade,
      uf: resposta.uf,
    });
  }

  /** Transforma qualquer falha num dos erros conhecidos da aplicação. */
  private traduzirErro(erro: unknown, cep: string): Error {
    if (erro instanceof CepNaoEncontradoError) {
      return erro;
    }
    if (erro instanceof HttpErrorResponse && erro.status === 400) {
      return new CepInvalidoError(cep);
    }
    // Sem conexão (status 0), erro do servidor (5xx) ou tempo esgotado
    return new ViaCepIndisponivelError(erro);
  }
}
