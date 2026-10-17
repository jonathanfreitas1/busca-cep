import { Routes } from '@angular/router';
import { CepPage } from './cep-page/cep-page';
import { BuscasApiRepository } from './services/buscas-api.repository';
import { BuscasRepository } from './services/buscas.repository';
import { BuscasStore } from './services/buscas.store';

export default [
  {
    path: '',
    component: CepPage,
    title: 'Endereços | Busca CEP',
    providers: [
      // Única linha que decide ONDE o histórico é guardado (trocar aqui na T20)
      { provide: BuscasRepository, useClass: BuscasApiRepository },
      BuscasStore,
    ],
  },
] satisfies Routes;
