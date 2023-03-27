import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EmptyRoundPage } from './empty-round.page';

const routes: Routes = [
  {
    path: '',
    component: EmptyRoundPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmptyRoundPageRoutingModule {}
