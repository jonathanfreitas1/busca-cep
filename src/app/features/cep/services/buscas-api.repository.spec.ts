import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Busca } from '../models/busca.model';
import { Endereco } from '../models/endereco.model';
import { HistoricoIndisponivelError } from '../models/erros-cep.model';
import { BuscaDto, BuscasApiRepository } from './buscas-api.repository';

const URL_BUSCAS = `${environment.apiUrl}/buscas`;

const DTO_PRACA_DA_SE: BuscaDto = {
  id: 'F5pAe5jq0Y8',
  dataHora: '2026-10-18T13:22:00.000Z',
  endereco: {
    cep: '01001-000',
    logradouro: 'Praça da Sé',
    complemento: 'lado ímpar',
    bairro: 'Sé',
    localidade: 'São Paulo',
    uf: 'SP',
  },
};

describe('BuscasApiRepository', () => {
  let repositorio: BuscasApiRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), BuscasApiRepository],
    });

    repositorio = TestBed.inject(BuscasApiRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('listar', () => {
    it('deve buscar as buscas na API e convertê-las para o domínio', async () => {
      const resultado = firstValueFrom(repositorio.listar());

      http.expectOne(URL_BUSCAS).flush([DTO_PRACA_DA_SE]);

      const [busca] = await resultado;
      expect(busca).toBeInstanceOf(Busca);
      expect(busca.id).toBe('F5pAe5jq0Y8');
      expect(busca.endereco).toBeInstanceOf(Endereco);
      expect(busca.endereco.descricao).toBe('Praça da Sé, Sé - São Paulo/SP');
      expect(busca.dataHora).toEqual(new Date('2026-10-18T13:22:00.000Z'));
    });

    it('deve emitir HistoricoIndisponivelError quando a API estiver desligada', async () => {
      const resultado = firstValueFrom(repositorio.listar());

      http.expectOne(URL_BUSCAS).error(new ProgressEvent('error'));

      await expect(resultado).rejects.toBeInstanceOf(HistoricoIndisponivelError);
    });
  });

  describe('salvar', () => {
    const busca = new Busca(
      'id-do-cliente',
      new Endereco(DTO_PRACA_DA_SE.endereco),
      new Date('2026-10-18T13:22:00.000Z'),
    );

    it('deve enviar um POST com a busca no formato da API', async () => {
      const resultado = firstValueFrom(repositorio.salvar(busca));

      const requisicao = http.expectOne(URL_BUSCAS);
      expect(requisicao.request.method).toBe('POST');
      expect(requisicao.request.body).toEqual({ ...DTO_PRACA_DA_SE, id: 'id-do-cliente' });
      requisicao.flush(DTO_PRACA_DA_SE);

      await resultado;
    });

    it('deve devolver a busca com o id gerado pelo servidor', async () => {
      const resultado = firstValueFrom(repositorio.salvar(busca));

      http.expectOne(URL_BUSCAS).flush(DTO_PRACA_DA_SE); // servidor trocou o id

      const salva = await resultado;
      expect(salva).toBeInstanceOf(Busca);
      expect(salva.id).toBe('F5pAe5jq0Y8');
    });

    it('deve emitir HistoricoIndisponivelError quando o servidor falhar', async () => {
      const resultado = firstValueFrom(repositorio.salvar(busca));

      http.expectOne(URL_BUSCAS).flush('', { status: 500, statusText: 'Internal Server Error' });

      await expect(resultado).rejects.toBeInstanceOf(HistoricoIndisponivelError);
    });
  });

  describe('remover', () => {
    const busca = new Busca(
      'F5pAe5jq0Y8',
      new Endereco(DTO_PRACA_DA_SE.endereco),
      new Date('2026-10-18T13:22:00.000Z'),
    );

    it('deve enviar um DELETE para a URL da busca', async () => {
      const resultado = firstValueFrom(repositorio.remover(busca));

      const requisicao = http.expectOne(`${URL_BUSCAS}/F5pAe5jq0Y8`);
      expect(requisicao.request.method).toBe('DELETE');
      requisicao.flush(DTO_PRACA_DA_SE);

      await expect(resultado).resolves.toBeUndefined();
    });

    it('deve considerar sucesso quando a busca já não existir (404)', async () => {
      const resultado = firstValueFrom(repositorio.remover(busca));

      http
        .expectOne(`${URL_BUSCAS}/F5pAe5jq0Y8`)
        .flush({ error: 'Not Found' }, { status: 404, statusText: 'Not Found' });

      await expect(resultado).resolves.toBeUndefined();
    });

    it('deve emitir HistoricoIndisponivelError quando a API estiver desligada', async () => {
      const resultado = firstValueFrom(repositorio.remover(busca));

      http.expectOne(`${URL_BUSCAS}/F5pAe5jq0Y8`).error(new ProgressEvent('error'));

      await expect(resultado).rejects.toBeInstanceOf(HistoricoIndisponivelError);
    });
  });
});
