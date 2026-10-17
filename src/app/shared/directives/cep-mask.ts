import { Directive, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Formata um texto qualquer como CEP: mantém só os dígitos (no máximo 8)
 * e insere o hífen depois do 5º dígito. Ex.: "01001000" → "01001-000".
 */
export function formatarCep(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 8);

  return digitos.replace(/^(\d{5})(\d)/, '$1-$2');
}

/**
 * Máscara de CEP: formata o campo enquanto o usuário digita ou cola.
 * Uso: <input matInput formControlName="cep" appCepMask />
 *
 * Não usa maxlength de propósito: o navegador cortaria um texto colado
 * ("CEP: 70040-010" → "CEP: 7004") antes da formatação. O limite de 8 dígitos
 * é aplicado pelo formatarCep.
 */
@Directive({
  selector: 'input[appCepMask]',
  host: {
    inputmode: 'numeric', // teclado numérico no celular
    autocomplete: 'postal-code', // o navegador pode sugerir o CEP do usuário
    '(input)': 'aoDigitar($event)',
  },
})
export class CepMask {
  // Opcional: a diretiva também funciona num campo sem formulário
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  protected aoDigitar(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const formatado = formatarCep(campo.value);

    if (campo.value !== formatado) {
      campo.value = formatado;
    }

    // Garante que o formulário guarde o valor formatado, e não o digitado
    const controle = this.ngControl?.control;
    if (controle && controle.value !== formatado) {
      controle.setValue(formatado);
    }
  }
}
