import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GroupContentPage } from './group-content.page';

const routes: Routes = [
  {
    path: '',
    component: GroupContentPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GroupContentPageRoutingModule {
    public static readonly PATH: string = 'group-content';
}
