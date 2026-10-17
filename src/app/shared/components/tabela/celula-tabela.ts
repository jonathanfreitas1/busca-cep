import { Directive, inject, input, TemplateRef } from '@angular/core';

/** Contexto disponível dentro do molde: `let-linha` recebe a linha da tabela. */
export interface ContextoCelula<T> {
  readonly $implicit: T;
}

/**
 * Molde de uma célula da Tabela, para a coluna de mesma chave.
 * Uso: <ng-template appCelula="data" [appCelulaDe]="linhas()" let-linha>...</ng-template>
 */
@Directive({ selector: 'ng-template[appCelula]' })
export class CelulaTabela<T> {
  /** Chave da coluna que este molde preenche. */
  readonly chave = input.required<string>({ alias: 'appCelula' });

  /**
   * As mesmas linhas passadas à Tabela. Não muda nada em tempo de execução:
   * serve só para o TypeScript descobrir o tipo de `let-linha` no template.
   */
  readonly linhas = input<readonly T[]>([], { alias: 'appCelulaDe' });

  readonly molde = inject<TemplateRef<ContextoCelula<T>>>(TemplateRef);

  /** Informa ao compilador o tipo do contexto do molde (evita `any` no `let-linha`). */
  static ngTemplateContextGuard<T>(
    _diretiva: CelulaTabela<T>,
    contexto: unknown,
  ): contexto is ContextoCelula<T> {
    return true;
  }
}
