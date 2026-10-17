import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { Endereco } from '../models/endereco.model';
import {
  CepInvalidoError,
  CepNaoEncontradoError,
  ViaCepIndisponivelError,
} from '../models/erros-cep.model';
import { ViaCepResposta } from '../models/via-cep-resposta.model';
import { ViaCepService } from './via-cep.service';

// Resposta real do ViaCEP para 01001-000
const RESPOSTA_PRACA_DA_SE: ViaCepResposta = {
  cep: '01001-000',
  logradouro: 'Praça da Sé',
  complemento: 'lado ímpar',
  unidade: '',
  bairro: 'Sé',
  localidade: 'São Paulo',
  uf: 'SP',
  estado: 'São Paulo',
  regiao: 'Sudeste',
  ibge: '3550308',
  gia: '1004',
  ddd: '11',
  siafi: '7107',
};

const URL_PRACA_DA_SE = 'https://viacep.com.br/ws/01001000/json/';

describe('ViaCepService', () => {
  let servico: ViaCepService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    servico = TestBed.inject(ViaCepService);
    http = TestBed.inject(HttpTestingController);
  });

  // Garante que nenhum teste deixou requisição sem resposta ou fez requisição inesperada
  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  it('deve buscar o endereço e convertê-lo para Endereco', async () => {
    const resultado = firstValueFrom(servico.buscar('01001-000'));

    const requisicao = http.expectOne(URL_PRACA_DA_SE);
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush(RESPOSTA_PRACA_DA_SE);

    const endereco = await resultado;
    expect(endereco).toBeInstanceOf(Endereco);
    expect(endereco.cep).toBe('01001-000');
    expect(endereco.descricao).toBe('Praça da Sé, Sé - São Paulo/SP');
  });

  it('deve aceitar o CEP sem máscara', async () => {
    const resultado = firstValueFrom(servico.buscar('01001000'));

    http.expectOne(URL_PRACA_DA_SE).flush(RESPOSTA_PRACA_DA_SE);

    await expect(resultado).resolves.toBeInstanceOf(Endereco);
  });

  it('deve emitir CepNaoEncontradoError quando o ViaCEP responder { erro: "true" }', async () => {
    const resultado = firstValueFrom(servico.buscar('00000-000'));

    http.expectOne('https://viacep.com.br/ws/00000000/json/').flush({ erro: 'true' });

    await expect(resultado).rejects.toBeInstanceOf(CepNaoEncontradoError);
  });

  it('deve emitir CepInvalidoError sem chamar a API quando o CEP não tiver 8 dígitos', async () => {
    const resultado = firstValueFrom(servico.buscar('1234'));

    await expect(resultado).rejects.toBeInstanceOf(CepInvalidoError);
    // nenhuma requisição: o http.verify() do afterEach falharia se houvesse
  });

  it('deve emitir CepInvalidoError quando o ViaCEP responder 400', async () => {
    const resultado = firstValueFrom(servico.buscar('01001-000'));

    http.expectOne(URL_PRACA_DA_SE).flush('', { status: 400, statusText: 'Bad Request' });

    await expect(resultado).rejects.toBeInstanceOf(CepInvalidoError);
  });

  it('deve emitir ViaCepIndisponivelError quando não houver conexão', async () => {
    const resultado = firstValueFrom(servico.buscar('01001-000'));

    http.expectOne(URL_PRACA_DA_SE).error(new ProgressEvent('error'));

    await expect(resultado).rejects.toBeInstanceOf(ViaCepIndisponivelError);
  });

  it('deve emitir ViaCepIndisponivelError quando o servidor falhar (500)', async () => {
    const resultado = firstValueFrom(servico.buscar('01001-000'));

    http.expectOne(URL_PRACA_DA_SE).flush('', { status: 500, statusText: 'Internal Server Error' });

    await expect(resultado).rejects.toBeInstanceOf(ViaCepIndisponivelError);
  });

  it('deve emitir ViaCepIndisponivelError e cancelar a requisição após 10 segundos', async () => {
    vi.useFakeTimers();
    const resultado = firstValueFrom(servico.buscar('01001-000'));
    const requisicao = http.expectOne(URL_PRACA_DA_SE);

    vi.advanceTimersByTime(10_000);

    await expect(resultado).rejects.toBeInstanceOf(ViaCepIndisponivelError);
    expect(requisicao.cancelled).toBe(true);
  });
});
