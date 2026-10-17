import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Formato de CEP aceito pela aplicação: 00000-000. */
export const CEP_REGEX = /^\d{5}-\d{3}$/;

/**
 * Valida o formato do CEP (00000-000).
 * Campo vazio é considerado válido: quem trata "obrigatório" é o Validators.required.
 */
export const cepValidator: ValidatorFn = (controle: AbstractControl): ValidationErrors | null => {
  const valor: unknown = controle.value;

  if (valor === null || valor === undefined || valor === '') {
    return null;
  }

  return typeof valor === 'string' && CEP_REGEX.test(valor) ? null : { cepInvalido: true };
};
