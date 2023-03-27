import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GroupScanGroupPage } from './group-scan-group.page';

const routes: Routes = [
  {
    path: '',
    component: GroupScanGroupPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GroupScanGroupPageRoutingModule {
    public static readonly PATH: string = 'group-scan-group';
}
