import {Component, Input, ViewChild} from '@angular/core';
import {ViewWillEnter} from '@ionic/angular';
import {NavService} from '@app/services/nav/nav.service';
import {FormPanelComponent} from '@common/components/panel/form-panel/form-panel.component';
import {HeaderConfig} from '@common/components/panel/model/header-config';
import {TransportCardMode} from '@common/components/transport-card/transport-card.component';
import {TransportRoundLine} from '@entities/transport-round-line';
import {NavPathEnum} from '@app/services/nav/nav-path.enum';
import {TransportRound} from '@entities/transport-round';

@Component({
    selector: 'wii-transport-collect-natures',
    templateUrl: './transport-collect-natures.page.html',
    styleUrls: ['./transport-collect-natures.page.scss'],
})
export class TransportCollectNaturesPage implements ViewWillEnter {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public headerConfig: HeaderConfig;

    public mode: TransportCardMode;

    @Input()
    public transport: TransportRoundLine;

    @Input()
    public round: TransportRound;

    private depositedQuantities: {[nature: number]: number} = {};
    private collectedPacksLocations: Array<number>;

    public constructor(private navService: NavService) {
    }

    public ionViewWillEnter(): void {
        if (this.navService.popItem
            && this.navService.popItem.path !== NavPathEnum.TRANSPORT_COLLECT_NATURES) {
            return;
        }

        this.transport = this.navService.param('transport');
        this.collectedPacksLocations = this.navService.param('collectedPacksLocations');
        this.round = this.navService.param('round');

        if(this.transport) {
            for(const nature of this.transport.natures_to_collect) {
                this.setCollectedQuantity(nature.nature_id, nature.collected_quantity || 1);
            }
        } else if(this.round) {
            for(const transport of this.round.lines) {
                for(const nature of (transport.natures_to_collect || (transport.collect ? transport.collect.natures_to_collect : []))) {
                    this.setDepositedQuantity(nature.nature_id, nature.collected_quantity);
                }
            }
        }

        if(this.transport) {
            this.headerConfig = {
                title: `Collecte`,
                subtitle: [`ODT${this.transport.number}`],
                leftIcon: {
                    name: 'collect-hand.svg',
                    color: `purple`,
                },
                rightBadge: {
                    label: this.transport.type,
                    icon: this.transport.type_icon,
                    color: {
                        background: `#CBCBCB`,
                        font: `#666666`,
                    },
                    inline: true
                },
            };
        }
    }

    public setCollectedQuantity(nature_id: number, value: number) {
        for(const nature of this.transport.natures_to_collect) {
            if(nature.nature_id === nature_id) {
                nature.collected_quantity = value || nature.quantity_to_collect;
                return;
            }
        }
    }

    public setDepositedQuantity(nature_id: number, value: number) {
        this.depositedQuantities[nature_id] = value;
    }

    public finishTransport() {
        if(this.transport) {
            this.navService.push(NavPathEnum.FINISH_TRANSPORT, {
                transport: this.transport,
                round: this.round
            });
        } else {
            const formattedPacks = [];
            for(const [nature, value] of Object.entries(this.depositedQuantities)) {
                formattedPacks.push({
                    nature_id: nature,
                    quantity: value,
                });
            }

            for(const transport of this.round.lines) {
                for(const nature of transport.natures_to_collect || (transport.collect ? transport.collect.natures_to_collect : [])) {
                    if(this.depositedQuantities[nature.nature_id] === undefined) {
                        formattedPacks.push({
                            nature_id: nature.nature_id,
                            quantity: nature.collected_quantity,
                        })
                    }
                }
            }

            this.navService.push(NavPathEnum.TRANSPORT_DEPOSIT_LOCATION, {
                round: this.round,
                depositedCollectPacks: formattedPacks,
                skippedMenu: this.navService.param('skippedMenu'),
                collectedPacksLocations: this.collectedPacksLocations,
            });
        }
    }

}
