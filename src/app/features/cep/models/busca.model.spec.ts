import { Busca } from './busca.model';
import { Endereco } from './endereco.model';

describe('Busca', () => {
  const endereco = new Endereco({
    cep: '01001-000',
    logradouro: 'Praça da Sé',
    complemento: 'lado ímpar',
    bairro: 'Sé',
    localidade: 'São Paulo',
    uf: 'SP',
  });
  const dataHora = new Date(2026, 9, 18, 10, 22); // 18/10/2026 10:22 (mês começa em 0)

  it('deve guardar o endereço e a data informados', () => {
    const busca = Busca.criar(endereco, dataHora);

    expect(busca.endereco).toBe(endereco);
    expect(busca.dataHora).toBe(dataHora);
  });

  it('deve expor o CEP do endereço', () => {
    const busca = Busca.criar(endereco, dataHora);

    expect(busca.cep).toBe('01001-000');
  });

  it('deve gerar um id diferente para cada busca criada', () => {
    const primeira = Busca.criar(endereco, dataHora);
    const segunda = Busca.criar(endereco, dataHora);

    expect(primeira.id).toBeTruthy();
    expect(segunda.id).toBeTruthy();
    expect(primeira.id).not.toBe(segunda.id);
  });

  it('deve permitir recriar uma busca existente com o id original', () => {
    const busca = new Busca('id-salvo', endereco, dataHora);

    expect(busca.id).toBe('id-salvo');
  });
});
