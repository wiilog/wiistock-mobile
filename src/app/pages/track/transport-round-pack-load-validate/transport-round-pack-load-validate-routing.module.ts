import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TransportRoundPackLoadValidatePage } from './transport-round-pack-load-validate.page';

const routes: Routes = [
  {
    path: '',
    component: TransportRoundPackLoadValidatePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TransportRoundPackLoadConfirmPageRoutingModule {}
