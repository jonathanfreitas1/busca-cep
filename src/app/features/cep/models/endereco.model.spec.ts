import { DadosEndereco, Endereco } from './endereco.model';

// Cria um endereço completo, permitindo sobrescrever só os campos de cada cenário
function criarEndereco(alteracoes: Partial<DadosEndereco> = {}): Endereco {
  return new Endereco({
    cep: '01001-000',
    logradouro: 'Praça da Sé',
    complemento: 'lado ímpar',
    bairro: 'Sé',
    localidade: 'São Paulo',
    uf: 'SP',
    ...alteracoes,
  });
}

describe('Endereco', () => {
  describe('descricao', () => {
    it('deve montar "Logradouro, Bairro - Cidade/UF" com o endereço completo', () => {
      const endereco = criarEndereco();

      expect(endereco.descricao).toBe('Praça da Sé, Sé - São Paulo/SP');
    });

    it('deve omitir o bairro quando ele vier vazio', () => {
      const endereco = criarEndereco({
        logradouro: 'Quadra SBN Quadra 1',
        bairro: '',
        localidade: 'Brasília',
        uf: 'DF',
      });

      expect(endereco.descricao).toBe('Quadra SBN Quadra 1 - Brasília/DF');
    });

    it('deve mostrar só "Cidade/UF" para CEP de cidade inteira', () => {
      const endereco = criarEndereco({
        logradouro: '',
        bairro: '',
        localidade: 'Acrelândia',
        uf: 'AC',
      });

      expect(endereco.descricao).toBe('Acrelândia/AC');
    });

    it('deve tratar partes com apenas espaços como vazias', () => {
      const endereco = criarEndereco({ logradouro: '   ', bairro: 'Sé' });

      expect(endereco.descricao).toBe('Sé - São Paulo/SP');
    });

    it('não deve incluir o complemento', () => {
      const endereco = criarEndereco();

      expect(endereco.descricao).not.toContain('lado ímpar');
    });
  });
});
