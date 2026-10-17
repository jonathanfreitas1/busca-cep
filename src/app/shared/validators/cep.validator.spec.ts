import { FormControl } from '@angular/forms';
import { cepValidator } from './cep.validator';

describe('cepValidator', () => {
  it.each(['01001-000', '70040-010', '00000-000'])('deve aceitar "%s"', (cep) => {
    expect(cepValidator(new FormControl(cep))).toBeNull();
  });

  it.each([
    '01001000', // sem hífen
    '0100-1000', // hífen no lugar errado
    '01001-00', // incompleto
    '01001-0000', // dígitos a mais
    'abcde-fgh', // letras
    ' 01001-000', // espaço antes
    '01001-000 ', // espaço depois
  ])('deve recusar "%s"', (cep) => {
    expect(cepValidator(new FormControl(cep))).toEqual({ cepInvalido: true });
  });

  it.each(['', null])('deve ignorar valor vazio (%s), que é tratado pelo required', (valor) => {
    expect(cepValidator(new FormControl(valor))).toBeNull();
  });
});
