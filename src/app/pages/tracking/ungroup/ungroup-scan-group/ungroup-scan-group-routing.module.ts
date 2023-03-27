import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UngroupScanGroupPage } from './ungroup-scan-group.page';

const routes: Routes = [
  {
    path: '',
    component: UngroupScanGroupPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UngroupScanGroupPageRoutingModule {
}
