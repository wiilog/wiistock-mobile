import {Component} from '@angular/core';
import {ViewWillEnter} from '@ionic/angular';
import {NavService} from '@app/services/nav/nav.service';
import {TransportRoundLine} from '@entities/transport-round-line';
import {TransportCardMode} from '@common/components/transport-card/transport-card.component';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {TransportRound} from "@entities/transport-round";
import {TranslationService} from "@app/services/translations.service";

@Component({
    selector: 'wii-transport-show',
    templateUrl: './transport-show.page.html',
    styleUrls: ['./transport-show.page.scss'],
})
export class TransportShowPage implements ViewWillEnter {

    public modeViewOnly = TransportCardMode.VIEW;

    public transport: TransportRoundLine;
    public round: TransportRound;

    public shouldDisplayFreeFields: boolean;

    public mode: TransportCardMode;

    public constructor(private navService: NavService) {
    }

    public ionViewWillEnter(): void {
        this.mode = this.navService.param('mode');
        this.transport = this.navService.param('transport');
        this.round = this.navService.param('round');

        this.shouldDisplayFreeFields = this.transport.free_fields.filter(freeField => freeField.value !== '').length > 0;
    }

    public fail(): void {
        this.navService.push(NavPathEnum.TRANSPORT_FAILURE, {
            transport: this.transport,
            round: this.round,
        });
    }

    public depositOrCollect(): void {
        if(this.transport.kind === `collect`) {
            this.navService.push(NavPathEnum.TRANSPORT_COLLECT_NATURES, {
                transport: this.transport,
                round: this.round,
            });
        } else {
            this.navService.push(NavPathEnum.TRANSPORT_PACK_DELIVER, {
                transport: this.transport,
                round: this.round,
            });
        }
    }

}
