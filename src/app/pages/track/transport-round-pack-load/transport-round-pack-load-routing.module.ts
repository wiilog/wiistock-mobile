import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TransportRoundPackLoadPage } from './transport-round-pack-load.page';

const routes: Routes = [
  {
    path: '',
    component: TransportRoundPackLoadPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TransportRoundPackLoadPageRoutingModule {}
