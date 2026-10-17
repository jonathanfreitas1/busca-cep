import { Routes } from '@angular/router';
import { CepPage } from './cep-page/cep-page';
import { BuscasApiRepository } from './services/buscas-api.repository';
import { BuscasRepository } from './services/buscas.repository';

export default [
  {
    path: '',
    component: CepPage,
    title: 'Endereços | Busca CEP',
    // Única linha que decide ONDE o histórico é guardado (trocar aqui na T20)
    providers: [{ provide: BuscasRepository, useClass: BuscasApiRepository }],
  },
] satisfies Routes;
