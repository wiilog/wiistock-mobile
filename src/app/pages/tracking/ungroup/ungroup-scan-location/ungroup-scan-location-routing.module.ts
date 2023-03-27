import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UngroupScanLocationPage } from './ungroup-scan-location.page';

const routes: Routes = [
  {
    path: '',
    component: UngroupScanLocationPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UngroupScanLocationPageRoutingModule {
}
