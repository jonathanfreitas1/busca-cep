import { Component, inject } from '@angular/core';
import { BuscaCep } from '../busca-cep/busca-cep';
import { BuscasStore } from '../services/buscas.store';
import { ListaBuscas } from '../lista-buscas/lista-buscas';

/**
 * Página "Busca de Endereços" (container): é o único componente da feature
 * que fala com o store; repassa estado aos filhos e recebe seus eventos.
 */
@Component({
  imports: [BuscaCep, ListaBuscas],
  selector: 'app-cep-page',
  styleUrl: './cep-page.scss',
  templateUrl: './cep-page.html',
})
export class CepPage {
  protected readonly store = inject(BuscasStore);

  constructor() {
    this.store.carregar();
  }
}
