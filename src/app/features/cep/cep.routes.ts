import { Routes } from '@angular/router';
import { CepPage } from './cep-page/cep-page';

export default [
  { path: '', component: CepPage, title: 'Endereços | Busca CEP' },
] satisfies Routes;
