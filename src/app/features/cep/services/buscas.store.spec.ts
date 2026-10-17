import { TestBed } from '@angular/core/testing';
import { Observable, of, Subject, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { Busca } from '../models/busca.model';
import { DadosEndereco, Endereco } from '../models/endereco.model';
import {
  CepInvalidoError,
  CepNaoEncontradoError,
  HistoricoIndisponivelError,
  ViaCepIndisponivelError,
} from '../models/erros-cep.model';
import { BuscasRepository } from './buscas.repository';
import { BuscasStore } from './buscas.store';
import { ViaCepService } from './via-cep.service';

/**
 * Repositório falso, em memória, só para os testes.
 * Como estende o BuscasRepository, o store o usa sem perceber a diferença (polimorfismo).
 */
class BuscasRepositoryEmMemoria extends BuscasRepository {
  buscas: Busca[] = [];
  falhar = false;
  private proximoId = 1;

  listar(): Observable<Busca[]> {
    return this.falhar ? this.falha() : of([...this.buscas]);
  }

  salvar(busca: Busca): Observable<Busca> {
    if (this.falhar) {
      return this.falha();
    }
    // Simula o json-server, que troca o id enviado por um gerado por ele
    const salva = new Busca(`servidor-${this.proximoId++}`, busca.endereco, busca.dataHora);
    this.buscas.push(salva);
    return of(salva);
  }

  remover(busca: Busca): Observable<void> {
    if (this.falhar) {
      return this.falha();
    }
    this.buscas = this.buscas.filter((b) => b.id !== busca.id);
    return of(undefined);
  }

  private falha(): Observable<never> {
    return throwError(() => new HistoricoIndisponivelError());
  }
}

function criarEndereco(dados: Partial<DadosEndereco> = {}): Endereco {
  return new Endereco({
    cep: '01001-000',
    logradouro: 'Praça da Sé',
    complemento: 'lado ímpar',
    bairro: 'Sé',
    localidade: 'São Paulo',
    uf: 'SP',
    ...dados,
  });
}

const AGORA = new Date(2026, 9, 18, 10, 22); // 18/10/2026 10:22

describe('BuscasStore', () => {
  let store: BuscasStore;
  let repositorio: BuscasRepositoryEmMemoria;
  let buscarNoViaCep: Mock<(cep: string) => Observable<Endereco>>;

  beforeEach(() => {
    // Relógio falso: new Date() passa a devolver sempre AGORA
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(AGORA);

    repositorio = new BuscasRepositoryEmMemoria();
    buscarNoViaCep = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        BuscasStore,
        { provide: BuscasRepository, useValue: repositorio },
        { provide: ViaCepService, useValue: { buscar: buscarNoViaCep } },
      ],
    });

    store = TestBed.inject(BuscasStore);
  });

  afterEach(() => vi.useRealTimers());

  describe('carregar', () => {
    it('deve carregar o histórico da mais recente para a mais antiga', () => {
      repositorio.buscas = [
        new Busca('antiga', criarEndereco({ cep: '69945-000' }), new Date(2026, 9, 16)),
        new Busca('recente', criarEndereco({ cep: '01001-000' }), new Date(2026, 9, 17)),
      ];

      store.carregar();

      expect(store.buscas().map((b) => b.id)).toEqual(['recente', 'antiga']);
      expect(store.carregandoHistorico()).toBe(false);
      expect(store.erroHistorico()).toBeNull();
    });

    it('deve informar o erro quando o histórico estiver indisponível', () => {
      repositorio.falhar = true;

      store.carregar();

      expect(store.buscas()).toEqual([]);
      expect(store.carregandoHistorico()).toBe(false);
      expect(store.erroHistorico()).toBe('Não foi possível acessar o histórico de buscas.');
    });

    it('deve limpar a mensagem de erro de uma busca anterior (ao voltar à página)', () => {
      buscarNoViaCep.mockReturnValue(throwError(() => new CepNaoEncontradoError('00000-000')));
      store.buscarCep('00000-000');

      store.carregar();

      expect(store.erroBusca()).toBeNull();
    });
  });

  describe('buscarCep', () => {
    it('deve buscar, salvar e colocar a busca no topo da lista', () => {
      repositorio.buscas = [new Busca('antiga', criarEndereco(), new Date(2026, 9, 16))];
      store.carregar();
      buscarNoViaCep.mockReturnValue(of(criarEndereco({ cep: '70040-010' })));

      store.buscarCep('70040-010');

      const [primeira] = store.buscas();
      expect(buscarNoViaCep).toHaveBeenCalledWith('70040-010');
      expect(primeira.id).toBe('servidor-1'); // id devolvido pelo repositório
      expect(primeira.cep).toBe('70040-010');
      expect(primeira.dataHora).toEqual(AGORA);
      expect(store.buscas()).toHaveLength(2);
      expect(store.erroBusca()).toBeNull();
    });

    it('deve indicar "buscando" enquanto a consulta não termina', () => {
      const resposta = new Subject<Endereco>();
      buscarNoViaCep.mockReturnValue(resposta);

      store.buscarCep('01001-000');
      expect(store.buscando()).toBe(true);

      resposta.next(criarEndereco());
      resposta.complete();
      expect(store.buscando()).toBe(false);
    });

    it('deve ignorar um novo pedido enquanto o anterior está em andamento', () => {
      buscarNoViaCep.mockReturnValue(new Subject<Endereco>()); // nunca responde

      store.buscarCep('01001-000');
      store.buscarCep('01001-000');

      expect(buscarNoViaCep).toHaveBeenCalledTimes(1);
    });

    it('não deve salvar quando o CEP não existir', () => {
      buscarNoViaCep.mockReturnValue(throwError(() => new CepNaoEncontradoError('00000-000')));

      store.buscarCep('00000-000');

      expect(repositorio.buscas).toEqual([]);
      expect(store.buscas()).toEqual([]);
      expect(store.buscando()).toBe(false);
      expect(store.erroBusca()).toBe('CEP não encontrado.');
    });

    it('deve informar o erro quando não conseguir salvar no histórico', () => {
      buscarNoViaCep.mockReturnValue(of(criarEndereco()));
      repositorio.falhar = true;

      store.buscarCep('01001-000');

      expect(store.buscas()).toEqual([]);
      expect(store.erroBusca()).toBe('Não foi possível acessar o histórico de buscas.');
    });

    it('deve limpar o erro anterior ao fazer uma nova busca', () => {
      buscarNoViaCep.mockReturnValueOnce(throwError(() => new CepNaoEncontradoError('00000-000')));
      store.buscarCep('00000-000');
      buscarNoViaCep.mockReturnValueOnce(of(criarEndereco()));

      store.buscarCep('01001-000');

      expect(store.erroBusca()).toBeNull();
    });

    it.each([
      [new CepInvalidoError('1234'), 'CEP inválido. Verifique o número digitado.'],
      [new CepNaoEncontradoError('00000-000'), 'CEP não encontrado.'],
      [
        new ViaCepIndisponivelError(),
        'Não foi possível consultar o CEP agora. Tente novamente em instantes.',
      ],
      [new Error('qualquer outro'), 'Ocorreu um erro inesperado. Tente novamente.'],
    ])('deve traduzir %s para uma mensagem ao usuário', (erro, mensagem) => {
      buscarNoViaCep.mockReturnValue(throwError(() => erro));

      store.buscarCep('01001-000');

      expect(store.erroBusca()).toBe(mensagem);
    });
  });

  describe('remover', () => {
    const busca = new Busca('servidor-9', criarEndereco(), new Date(2026, 9, 17));

    beforeEach(() => {
      repositorio.buscas = [busca];
      store.carregar();
    });

    it('deve remover a busca do histórico e da lista', () => {
      store.remover(busca);

      expect(repositorio.buscas).toEqual([]);
      expect(store.buscas()).toEqual([]);
    });

    it('deve manter a busca e informar o erro quando a remoção falhar', () => {
      repositorio.falhar = true;

      store.remover(busca);

      expect(store.buscas()).toEqual([busca]);
      expect(store.erroHistorico()).toBe('Não foi possível acessar o histórico de buscas.');
    });
  });
});
