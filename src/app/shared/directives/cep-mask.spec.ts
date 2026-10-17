import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CepMask, formatarCep } from './cep-mask';

describe('formatarCep', () => {
  it.each([
    ['', ''],
    ['0', '0'],
    ['01001', '01001'],
    ['010010', '01001-0'],
    ['01001000', '01001-000'],
    ['01001-000', '01001-000'],
    ['0100100099', '01001-000'], // dígitos a mais são descartados
    ['a0b1c001', '01001'], // letras são removidas
    ['CEP: 70040-010', '70040-010'], // texto colado com prefixo
  ])('deve formatar "%s" como "%s"', (entrada, esperado) => {
    expect(formatarCep(entrada)).toBe(esperado);
  });
});

// Componente "hospedeiro": existe só para testar a diretiva dentro de um formulário
@Component({
  imports: [ReactiveFormsModule, CepMask],
  template: `<input [formControl]="cep" appCepMask />`,
})
class Hospedeiro {
  readonly cep = new FormControl('', { nonNullable: true });
}

describe('CepMask', () => {
  let fixture: ComponentFixture<Hospedeiro>;
  let campo: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Hospedeiro] }).compileComponents();

    fixture = TestBed.createComponent(Hospedeiro);
    await fixture.whenStable();
    campo = fixture.nativeElement.querySelector('input');
  });

  // Simula o navegador: altera o texto do campo e dispara o evento "input"
  function digitar(texto: string): void {
    campo.value = texto;
    campo.dispatchEvent(new Event('input'));
  }

  function digitarTeclaPorTecla(texto: string): void {
    for (const tecla of texto) {
      digitar(campo.value + tecla);
    }
  }

  it('deve formatar o campo e o formulário enquanto o usuário digita', () => {
    digitarTeclaPorTecla('01001000');

    expect(campo.value).toBe('01001-000');
    expect(fixture.componentInstance.cep.value).toBe('01001-000');
  });

  it('deve ignorar letras digitadas', () => {
    digitarTeclaPorTecla('0a1b');

    expect(campo.value).toBe('01');
    expect(fixture.componentInstance.cep.value).toBe('01');
  });

  it('deve formatar um texto colado de uma vez, mesmo com outros caracteres', () => {
    digitar('CEP: 70040-010');

    expect(campo.value).toBe('70040-010');
    expect(fixture.componentInstance.cep.value).toBe('70040-010');
  });

  it('deve parar no 8º dígito quando o usuário continuar digitando', () => {
    digitarTeclaPorTecla('0100100099');

    expect(campo.value).toBe('01001-000');
  });

  it('deve configurar teclado numérico e preenchimento automático de CEP', () => {
    expect(campo.getAttribute('inputmode')).toBe('numeric');
    expect(campo.getAttribute('autocomplete')).toBe('postal-code');
  });

  it('não deve usar maxlength, que cortaria um texto colado antes da formatação', () => {
    expect(campo.hasAttribute('maxlength')).toBe(false);
  });
});
