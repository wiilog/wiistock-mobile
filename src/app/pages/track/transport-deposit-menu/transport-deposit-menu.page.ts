import {Component} from '@angular/core';
import {ViewWillEnter} from '@ionic/angular';
import {NavService} from '@app/services/nav/nav.service';
import {TransportRound} from '@database/transport-round';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';

@Component({
    selector: 'wii-transport-deposit-menu',
    templateUrl: './transport-deposit-menu.page.html',
    styleUrls: ['./transport-deposit-menu.page.scss'],
})
export class TransportDepositMenuPage implements ViewWillEnter {

    public round: TransportRound;
    public collectedPacksLocations: Array<number>;
    public undeliveredPacksLocations: Array<number>;

    public constructor(private navService: NavService) {
    }

    public ionViewWillEnter() {
        this.round = this.navService.param('round');
        this.collectedPacksLocations = this.navService.param('collectedPacksLocations');
        this.undeliveredPacksLocations = this.navService.param('undeliveredPacksLocations');
    }

    public delivery() {
        this.navService.push(NavPathEnum.TRANSPORT_DEPOSIT_PACKS, {
            round: this.round,
            skippedMenu: false,
            undeliveredPacksLocations: this.undeliveredPacksLocations
        });
    }

    public collect() {
        this.navService.push(NavPathEnum.TRANSPORT_COLLECT_NATURES, {
            round: this.round,
            skippedMenu: false,
            collectedPacksLocations: this.collectedPacksLocations
        });
    }
}
