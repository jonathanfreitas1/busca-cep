import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

/** Textos do diálogo de confirmação. */
export interface DadosConfirmacao {
  readonly titulo: string;
  readonly mensagem: string;
  /** Texto do botão que confirma a ação. Padrão: "Confirmar". */
  readonly textoConfirmar?: string;
  /** Texto do botão que desiste da ação. Padrão: "Cancelar". */
  readonly textoCancelar?: string;
  /** A ação apaga ou desfaz algo (ex.: remover): o botão de confirmar fica vermelho. */
  readonly destrutiva?: boolean;
}

/** Id do parágrafo da mensagem: o diálogo o usa como descrição acessível (aria-describedby). */
export const ID_MENSAGEM_CONFIRMACAO = 'dialogo-confirmacao-mensagem';

/**
 * Diálogo genérico "Tem certeza?". Não é aberto diretamente:
 * use o ConfirmacaoService, que devolve a resposta como Observable<boolean>.
 */
@Component({
  imports: [MatDialogModule, MatButtonModule],
  selector: 'app-dialogo-confirmacao',
  template: `
    <h2 mat-dialog-title>{{ dados.titulo }}</h2>

    <mat-dialog-content>
      <p [id]="idMensagem">{{ dados.mensagem }}</p>
    </mat-dialog-content>

    <!-- "Cancelar" vem primeiro: recebe o foco inicial (a opção segura).
         Os dois botões têm o mesmo formato; só a cor indica a ação destrutiva. -->
    <mat-dialog-actions align="end">
      <button matButton="filled" type="button" [mat-dialog-close]="false">
        {{ dados.textoCancelar ?? 'Cancelar' }}
      </button>
      <button
        matButton="filled"
        type="button"
        [class.botao--perigo]="dados.destrutiva"
        [mat-dialog-close]="true"
      >
        {{ dados.textoConfirmar ?? 'Confirmar' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class DialogoConfirmacao {
  protected readonly dados = inject<DadosConfirmacao>(MAT_DIALOG_DATA);
  protected readonly idMensagem = ID_MENSAGEM_CONFIRMACAO;
}
