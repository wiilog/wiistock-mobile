import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TransportFailurePage } from './transport-failure.page';

const routes: Routes = [
  {
    path: '',
    component: TransportFailurePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TransportFailurePageRoutingModule {}
