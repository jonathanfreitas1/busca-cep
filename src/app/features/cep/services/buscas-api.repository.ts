import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, OperatorFunction, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Busca } from '../models/busca.model';
import { DadosEndereco, Endereco } from '../models/endereco.model';
import { HistoricoIndisponivelError } from '../models/erros-cep.model';
import { BuscasRepository } from './buscas.repository';

/** Formato de uma busca como ela é salva no json-server (JSON não tem tipo Date). */
export interface BuscaDto {
  readonly id: string;
  readonly dataHora: string; // ISO 8601, ex.: "2026-10-18T13:22:00.000Z"
  readonly endereco: DadosEndereco;
}

/** Histórico de buscas guardado numa API REST (json-server). */
@Injectable()
export class BuscasApiRepository extends BuscasRepository {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/buscas`;

  listar(): Observable<Busca[]> {
    return this.http.get<BuscaDto[]>(this.url).pipe(
      map((dtos) => dtos.map((dto) => this.deDto(dto))),
      this.historicoIndisponivel(),
    );
  }

  salvar(busca: Busca): Observable<Busca> {
    // O json-server v1 ignora o id enviado e gera o próprio: vale o da resposta
    return this.http.post<BuscaDto>(this.url, this.paraDto(busca)).pipe(
      map((dto) => this.deDto(dto)),
      this.historicoIndisponivel(),
    );
  }

  remover(busca: Busca): Observable<void> {
    return this.http.delete<unknown>(`${this.url}/${busca.id}`).pipe(
      map(() => undefined),
      // 404: a busca já não existia; o resultado desejado (não estar no histórico) já vale
      catchError((erro: unknown) =>
        erro instanceof HttpErrorResponse && erro.status === 404
          ? of(undefined)
          : throwError(() => erro),
      ),
      this.historicoIndisponivel(),
    );
  }

  /** Converte a classe do domínio para o formato salvo. */
  private paraDto(busca: Busca): BuscaDto {
    const { cep, logradouro, complemento, bairro, localidade, uf } = busca.endereco;

    return {
      id: busca.id,
      dataHora: busca.dataHora.toISOString(),
      endereco: { cep, logradouro, complemento, bairro, localidade, uf },
    };
  }

  /** Converte o formato salvo de volta para a classe do domínio. */
  private deDto(dto: BuscaDto): Busca {
    return new Busca(dto.id, new Endereco(dto.endereco), new Date(dto.dataHora));
  }

  /** Operador reutilizável: transforma qualquer falha da API em HistoricoIndisponivelError. */
  private historicoIndisponivel<T>(): OperatorFunction<T, T> {
    return catchError((erro: unknown) => throwError(() => new HistoricoIndisponivelError(erro)));
  }
}
