import {NgModule} from '@angular/core';
import {CommonModule as NgCommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {IonicModule} from '@ionic/angular';

import {LoginPageRoutingModule} from './login-routing.module';

import {LoginPage} from './login.page';
import {CommonModule} from "@common/common.module";

@NgModule({
    imports: [
        NgCommonModule,
        CommonModule,
        FormsModule,
        IonicModule,
        LoginPageRoutingModule,
    ],
    declarations: [LoginPage]
})
export class LoginPageModule {
}
