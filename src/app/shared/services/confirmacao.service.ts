import { inject, Service } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { map, Observable } from 'rxjs';
import {
  DadosConfirmacao,
  DialogoConfirmacao,
  ID_MENSAGEM_CONFIRMACAO,
} from '../components/dialogo-confirmacao/dialogo-confirmacao';

/**
 * Pede confirmação ao usuário. Quem usa não depende do MatDialog:
 * só chama confirmar() e recebe true (confirmou) ou false (desistiu).
 */
@Service()
export class ConfirmacaoService {
  private readonly dialogo = inject(MatDialog);

  /**
   * Abre o diálogo de confirmação.
   * Emite true se o usuário confirmar; false se cancelar, apertar Esc ou clicar fora.
   */
  confirmar(dados: DadosConfirmacao): Observable<boolean> {
    return this.dialogo
      .open<DialogoConfirmacao, DadosConfirmacao, boolean>(DialogoConfirmacao, {
        data: dados,
        role: 'alertdialog', // pede uma resposta do usuário antes de continuar
        ariaDescribedBy: ID_MENSAGEM_CONFIRMACAO,
        autoFocus: 'first-tabbable', // o "Cancelar"
        restoreFocus: true, // ao fechar, o foco volta para quem abriu o diálogo
        // Ao definir maxWidth, o limite padrão do Material (80vw) deixa de valer:
        // no celular, o calc() garante 1rem de margem de cada lado
        maxWidth: 'min(28rem, calc(100vw - 2rem))',
      })
      .afterClosed()
      .pipe(map((resposta) => resposta === true));
  }
}
