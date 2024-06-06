import {Component} from '@angular/core';
import {CardListConfig} from '@common/components/card-list/card-list-config';
import {Preparation} from '@entities/preparation';
import {CardListColorEnum} from '@common/components/card-list/card-list-color.enum';
import {NavService} from '@app/services/nav/nav.service';
import {MainHeaderService} from '@app/services/main-header.service';
import {SqliteService} from '@app/services/sqlite/sqlite.service';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import * as moment from "moment";
import {ViewWillEnter} from "@ionic/angular";

@Component({
    selector: 'wii-reception-menu',
    templateUrl: './reception-menu.page.html',
    styleUrls: ['./reception-menu.page.scss'],
})
export class ReceptionMenuPage implements ViewWillEnter {
    public hasLoaded: boolean = false;

    public constructor() {
    }

    public ionViewWillEnter(): void {
    }
}
