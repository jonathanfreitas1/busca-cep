import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CepMask } from '../../../shared/directives/cep-mask';
import { cepValidator } from '../../../shared/validators/cep.validator';

/**
 * Formulário de busca por CEP (componente apresentacional):
 * valida e formata o CEP, e apenas EMITE o pedido de busca.
 * Quem busca de fato é o container (CepPage), via store.
 */
@Component({
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    CepMask,
  ],
  selector: 'app-busca-cep',
  styleUrl: './busca-cep.scss',
  templateUrl: './busca-cep.html',
})
export class BuscaCep {
  /** Há uma busca em andamento: o botão fica desabilitado. */
  readonly buscando = input(false);
  /** Mensagem sobre o resultado da busca (ex.: "CEP não encontrado."). */
  readonly erro = input<string | null>(null);
  /** Emitido com o CEP no formato 00000-000 quando o formulário é enviado válido. */
  readonly buscar = output<string>();

  protected readonly formulario = inject(NonNullableFormBuilder).group({
    cep: ['', [Validators.required, cepValidator]],
  });

  private readonly campoCep = viewChild.required<ElementRef<HTMLInputElement>>('campoCep');

  /** Último CEP enviado e o valor atual do campo (valueChanges convertido em signal). */
  private readonly cepEnviado = signal<string | null>(null);
  private readonly cepDigitado = toSignal(this.formulario.controls.cep.valueChanges, {
    initialValue: this.formulario.controls.cep.value,
  });

  /**
   * A mensagem do resultado só aparece enquanto o campo ainda mostra o CEP que a gerou:
   * ao editar o campo, ela some (evita "CEP não encontrado." ao lado de outro CEP).
   */
  protected readonly mensagem = computed(() =>
    this.cepDigitado() === this.cepEnviado() ? this.erro() : null,
  );

  protected enviar(): void {
    // O botão com disabledInteractive continua clicável (e o Enter no campo também
    // envia o formulário): a guarda aqui garante que não sai um novo pedido
    if (this.buscando()) {
      return;
    }

    if (this.formulario.invalid) {
      // Exibe os erros (borda vermelha + mensagem) e leva o foco ao campo,
      // para o leitor de tela anunciar o problema
      this.formulario.markAllAsTouched();
      this.campoCep().nativeElement.focus();
      return;
    }

    const cep = this.formulario.controls.cep.value;
    this.cepEnviado.set(cep);
    this.buscar.emit(cep);
  }
}
