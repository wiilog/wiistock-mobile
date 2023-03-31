import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TransportDepositLocationPage } from './transport-deposit-location.page';

const routes: Routes = [
  {
    path: '',
    component: TransportDepositLocationPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TransportDepositLocationPageRoutingModule {}
