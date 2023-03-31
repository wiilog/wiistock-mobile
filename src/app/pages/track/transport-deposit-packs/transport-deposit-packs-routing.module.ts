import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TransportDepositPacksPage } from './transport-deposit-packs.page';

const routes: Routes = [
  {
    path: '',
    component: TransportDepositPacksPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TransportDepositPacksPageRoutingModule {}
