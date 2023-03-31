import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TransportPackDeliverPage } from './transport-pack-deliver.page';

const routes: Routes = [
  {
    path: '',
    component: TransportPackDeliverPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TransportPackDeliverPageRoutingModule {}
