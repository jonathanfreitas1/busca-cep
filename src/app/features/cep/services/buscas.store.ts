import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, switchMap } from 'rxjs';
import { Busca } from '../models/busca.model';
import {
  CepInvalidoError,
  CepNaoEncontradoError,
  HistoricoIndisponivelError,
  ViaCepIndisponivelError,
} from '../models/erros-cep.model';
import { BuscasRepository } from './buscas.repository';
import { ViaCepService } from './via-cep.service';

/**
 * Estado da feature de CEP: une o ViaCEP e o histórico (Observables)
 * ao que a tela exibe (signals). Só o store altera o estado.
 *
 * Registrado nos providers da rota de CEP (e não na raiz), porque depende
 * do BuscasRepository, que também é registrado lá.
 */
@Injectable()
export class BuscasStore {
  private readonly viaCep = inject(ViaCepService);
  private readonly repositorio = inject(BuscasRepository);

  // Estado interno: gravável só aqui dentro
  private readonly _buscas = signal<readonly Busca[]>([]);
  private readonly _buscando = signal(false);
  private readonly _erroBusca = signal<string | null>(null);
  private readonly _carregandoHistorico = signal(false);
  private readonly _erroHistorico = signal<string | null>(null);
  private readonly _idBuscaNova = signal<string | null>(null);

  // Estado público: somente leitura

  /** Buscas do histórico, da mais recente para a mais antiga. */
  readonly buscas = computed(() =>
    [...this._buscas()].sort((a, b) => b.dataHora.getTime() - a.dataHora.getTime()),
  );
  /** Há uma busca de CEP em andamento. */
  readonly buscando = this._buscando.asReadonly();
  /** Mensagem do último erro ao buscar um CEP (exibida junto ao formulário). */
  readonly erroBusca = this._erroBusca.asReadonly();
  /** O histórico está sendo carregado. */
  readonly carregandoHistorico = this._carregandoHistorico.asReadonly();
  /** Mensagem do último erro ao carregar ou alterar o histórico (exibida junto à tabela). */
  readonly erroHistorico = this._erroHistorico.asReadonly();
  /** Id da busca que acabou de ser salva (a tabela destaca essa linha quando ela entra). */
  readonly idBuscaNova = this._idBuscaNova.asReadonly();

  /**
   * Carrega as buscas salvas. Chamado ao entrar na página: como o store sobrevive
   * à navegação, também limpa mensagens de erro e o destaque de visitas anteriores.
   */
  carregar(): void {
    this._carregandoHistorico.set(true);
    this._erroHistorico.set(null);
    this._erroBusca.set(null);
    this._idBuscaNova.set(null);

    this.repositorio
      .listar()
      .pipe(finalize(() => this._carregandoHistorico.set(false)))
      .subscribe({
        next: (buscas) => this._buscas.set(buscas),
        error: (erro: unknown) => this._erroHistorico.set(this.mensagemDe(erro)),
      });
  }

  /** Busca um CEP no ViaCEP e salva o resultado no histórico. */
  buscarCep(cep: string): void {
    // Evita buscas duplicadas (ex.: clique duplo no botão)
    if (this._buscando()) {
      return;
    }

    this._buscando.set(true);
    this._erroBusca.set(null);

    this.viaCep
      .buscar(cep)
      .pipe(
        // Só salva se o ViaCEP encontrou o endereço; se ele falhar, o fluxo para aqui
        switchMap((endereco) => this.repositorio.salvar(Busca.criar(endereco, new Date()))),
        finalize(() => this._buscando.set(false)),
      )
      .subscribe({
        // Usa a busca devolvida pelo repositório: o id definitivo é o dela
        next: (salva) => {
          this._buscas.update((buscas) => [salva, ...buscas]);
          this._idBuscaNova.set(salva.id);
        },
        error: (erro: unknown) =>
          this._erroBusca.set(
            // Aqui o histórico só falha ao SALVAR: o ViaCEP já encontrou o endereço
            erro instanceof HistoricoIndisponivelError
              ? 'O endereço foi encontrado, mas não foi possível salvá-lo no histórico.'
              : this.mensagemDe(erro),
          ),
      });
  }

  /** Remove uma busca; a linha sai da tabela depois que o histórico confirma. */
  remover(busca: Busca): void {
    this._erroHistorico.set(null);

    this.repositorio.remover(busca).subscribe({
      next: () => this._buscas.update((buscas) => buscas.filter((b) => b.id !== busca.id)),
      error: (erro: unknown) => this._erroHistorico.set(this.mensagemDe(erro)),
    });
  }

  /** Traduz os erros da aplicação para mensagens ao usuário. */
  private mensagemDe(erro: unknown): string {
    if (erro instanceof CepInvalidoError) {
      return 'CEP inválido. Verifique o número digitado.';
    }
    if (erro instanceof CepNaoEncontradoError) {
      return 'CEP não encontrado.';
    }
    if (erro instanceof ViaCepIndisponivelError) {
      return 'Não foi possível consultar o CEP agora. Tente novamente em instantes.';
    }
    if (erro instanceof HistoricoIndisponivelError) {
      return 'Não foi possível acessar o histórico de buscas.';
    }
    return 'Ocorreu um erro inesperado. Tente novamente.';
  }
}
